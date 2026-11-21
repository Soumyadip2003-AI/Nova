import { getSandbox } from "./utils";

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
  if (status >= 500) return `The app's home page returns HTTP ${status}${m ? ` (${m[0]})` : ""}.`;
  return m ? `The app's home page shows an error: ${m[0]}.` : null;
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
    const tsc = await run("npx tsc --noEmit --pretty false -p . 2>&1 | head -200", 90_000);
    problems.push(...typeErrorsFor(tsc, codeFiles).slice(0, 20));
  }

  // Give the dev server a moment to recompile what was just written.
  const page = await run(
    "sleep 3; curl -s -m 30 -o /tmp/nova-page.html -w '%{http_code}' http://localhost:3000; echo; head -c 20000 /tmp/nova-page.html",
    45_000,
  );
  const [statusLine = "", ...rest] = page.trimStart().split("\n");
  const pageIssue = pageProblem(Number(statusLine.trim()) || 0, rest.join("\n"));
  if (pageIssue) problems.push(pageIssue);

  return { ok: problems.length === 0, problems };
}

export function repairPrompt(problems: string[]): string {
  const report = problems.join("\n").slice(0, MAX_REPORT);
  return `Your code was checked before being shown to the user and has problems. Fix all of them by editing the files with createOrUpdateFiles. Do not start or restart the app; it reloads by itself.

Problems found:
${report}

When everything is fixed, end with the same <task_summary> format as before.`;
}
