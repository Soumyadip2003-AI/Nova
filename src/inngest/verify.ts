import { getSandbox } from "./utils";
import { DEV_SERVER_LOG, ensureDevServer } from "@/lib/project-files";

/* Self-healing check: after the agent writes code, Nova verifies it the way a
   developer would before handing it over, and feeds any problems back to the
   agent to fix. Two checks:
   1. TypeScript: `tsc --noEmit`, keeping only errors in files the agent wrote,
      so a template's own warnings never send it chasing code it did not touch.
   2. The running app: the preview's home page must load without a server error
      or a Next.js compile/runtime error page. */

export type VerifyResult = { ok: boolean; problems: string[] };

const MAX_REPORT = 3500;
const ERROR_PAGE = /Failed to compile|Build Error|Unhandled Runtime Error|Module not found|SyntaxError|ReferenceError|TypeError:/;

/** tsc output lines (with their indented continuations) that mention a changed file. */
export function typeErrorsFor(tscOutput: string, changed: string[]): string[] {
  const wanted = changed.map((p) => p.replace(/^\.?\//, ""));
  const out: string[] = [];
  let keep = false;
  for (const line of tscOutput.split("\n")) {
    if (/\(\d+,\d+\): error TS\d+/.test(line)) {
      keep = wanted.some((f) => line.startsWith(f) || line.includes(`/${f}`));
      if (keep) out.push(line.trim());
    } else if (keep && /^\s+/.test(line) && line.trim()) {
      out[out.length - 1] += ` ${line.trim()}`;
    }
  }
  return out;
}

/** The page check: a server error, or a Next.js error page in the HTML. */
export function pageProblem(status: number, html: string): string | null {
  if (status === 0) return "The app's home page did not respond.";
  const m = html.match(ERROR_PAGE);
  // The error page names the file, line and cause; pass that on so a repair
  // knows where to look instead of only "HTTP 500".
  const detail = m && m.index !== undefined ? errorDetail(html, m.index) : "";
  if (status >= 500) return `The app's home page returns HTTP ${status}${detail ? `: ${detail}` : m ? ` (${m[0]})` : ""}.`;
  return m ? `The app's home page shows an error: ${detail || m[0]}.` : null;
}

/** Readable text around an error found in the page's HTML. */
function errorDetail(html: string, index: number): string {
  return html
    .slice(index, index + 1200)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\n/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

export async function verifySandbox(sandboxId: string, changed: string[]): Promise<VerifyResult> {
  const sandbox = await getSandbox(sandboxId);
  const run = async (cmd: string, timeoutMs: number) => {
    try {
      const r = await sandbox.commands.run(cmd, { timeoutMs });
      return `${r.stdout}\n${r.stderr}`;
    } catch (e) {
      // A non-zero exit throws, but its output is exactly what we want.
      const err = e as { stdout?: string; stderr?: string; message?: string };
      return `${err.stdout ?? ""}\n${err.stderr ?? err.message ?? ""}`;
    }
  };

  const problems: string[] = [];
  const codeFiles = changed.filter((f) => /\.(tsx?|jsx?)$/.test(f));
  if (codeFiles.length) {
    // The sandbox has 2 GB with ~1.2 GB free beside next dev. The cap keeps a
    // runaway tsc from pushing the dev server out of memory; 320 MB was too
    // little for the template's 53 components (tsc aborted, checking nothing).
    const tsc = await run("NODE_OPTIONS=--max-old-space-size=768 npx tsc --noEmit --pretty false -p . 2>&1 | head -200", 90_000);
    problems.push(...typeErrorsFor(tsc, codeFiles).slice(0, 20));
  }

  // The dev server must be up before the app can be judged; if it died, start
  // it again (its own crash is not a problem in the agent's code to repair).
  // Budget: this whole check runs in one step, under Vercel's 300s limit.
  const server = await ensureDevServer(sandbox, 40_000);
  if (server === "down") {
    const log = await run(`tail -c 1500 ${DEV_SERVER_LOG} 2>/dev/null || true`, 10_000);
    problems.push(`The app's server does not start. Its last output: ${log.replace(/\s+/g, " ").trim().slice(-800) || "(none)"}`);
    return { ok: false, problems };
  }

  // Give the dev server a moment to recompile what was just written.
  const page = await run(
    "sleep 2; curl -s -m 40 -o /tmp/nova-page.html -w '%{http_code}' http://localhost:3000 || true; echo; head -c 20000 /tmp/nova-page.html 2>/dev/null",
    50_000,
  );
  const [statusLine = "", ...rest] = page.trimStart().split("\n");
  const pageIssue = pageProblem(Number(statusLine.trim()) || 0, rest.join("\n"));
  if (pageIssue) problems.push(pageIssue);

  // Full-stack apps: each API route the agent wrote must answer GET without a
  // server error (405 for POST-only routes is fine).
  for (const route of apiRoutesFor(changed).slice(0, 4)) {
    const out = await run(`curl -s -m 15 -o /tmp/nova-api.txt -w '%{http_code}' http://localhost:3000${route} || true; echo; head -c 400 /tmp/nova-api.txt 2>/dev/null`, 20_000);
    const [code = "", ...body] = out.trimStart().split("\n");
    const status = Number(code.trim()) || 0;
    if (status === 0 || status >= 500) {
      problems.push(`GET ${route} ${status ? `returns HTTP ${status}` : "did not respond"}${body.join(" ").trim() ? `: ${body.join(" ").replace(/\s+/g, " ").trim().slice(0, 300)}` : ""}`);
    }
  }

  return { ok: problems.length === 0, problems };
}

/** URL paths of the static API routes among the changed files (dynamic [id] routes are skipped). */
export function apiRoutesFor(changed: string[]): string[] {
  return changed
    .map((f) => f.replace(/^\.?\//, "").match(/^(?:src\/)?app\/(api\/.*?)\/?route\.(?:ts|js)$/)?.[1])
    .filter((p): p is string => !!p && !p.includes("["))
    .map((p) => `/${p.replace(/\([^)]*\)\//g, "").replace(/\/$/, "")}`);
}

/** Source files named in tsc problem lines, e.g. "app/layout.tsx(3,1): error ...". */
export function problemFiles(problems: string[]): string[] {
  const files = problems
    .flatMap((p) => {
      const tsFile = p.match(/^([\w./@-]+\.(?:tsx?|jsx?))\(\d+,\d+\)/)?.[1];
      if (tsFile) return [tsFile];
      // A failing API route: its handler, and the database module it most likely uses.
      const route = p.match(/^GET (\/api\/[\w/-]+)/)?.[1];
      return route ? [`app${route}/route.ts`, "lib/db.ts"] : [];
    });
  return [...new Set(files)].slice(0, 5);
}

/** Current contents of the given files in the sandbox; unreadable files are skipped. */
export async function readSandboxFiles(sandboxId: string, paths: string[]): Promise<Record<string, string>> {
  const sandbox = await getSandbox(sandboxId);
  const out: Record<string, string> = {};
  for (const path of paths) {
    try {
      out[path] = (await sandbox.files.read(path)).slice(0, 12_000);
    } catch {
      // A file named in an error may not exist; the problem text still guides the fix.
    }
  }
  return out;
}

/**
 * The repair instruction. It carries the current text of each broken file:
 * without it, models replied "fixed" from memory of their earlier answer
 * without editing anything, and the check failed again.
 */
export function repairPrompt(problems: string[], files: Record<string, string> = {}): string {
  const report = problems.join("\n").slice(0, MAX_REPORT);
  const shown = Object.entries(files)
    .map(([path, text]) => `--- ${path} (current contents) ---\n${text}`)
    .join("\n\n");
  return `Your code was checked before being shown to the user and it is broken. You must fix it now by calling createOrUpdateFiles with the corrected, complete contents of every file listed. Replying without calling createOrUpdateFiles does not fix anything. Do not start or restart the app; it reloads by itself.

Problems found:
${report}
${shown ? `\nThe files as they are right now:\n\n${shown}\n` : ""}
Common causes: import paths must use plain quotes ("next" or 'next'), never backticks; every JSX tag must be closed; only import components that exist.

When everything is fixed, end with the same <task_summary> format as before.`;
}
