import { Sandbox } from "@e2b/code-interpreter";
import { ensureDevServer, installDependencies, writeProjectAssets } from "@/lib/project-files";

const TEMPLATE_ID = () => process.env.E2B_TEMPLATE_ID || "c7kxk6kebmrc9xzxb09f";

/**
 * Start a fresh sandbox running the given files and return its preview URL.
 * The template starts the Next.js dev server on port 3000 by itself. The
 * user's uploaded images and a full-stack app's packages are restored too;
 * the app's database starts again from its seed data.
 */
export async function startPreview(files: Record<string, string>, isPro: boolean, projectId: string): Promise<string> {
    const sandbox = isPro
        ? await Sandbox.create(TEMPLATE_ID(), { timeoutMs: 1_200_000 })
        : await Sandbox.create(TEMPLATE_ID(), { timeoutMs: 15 * 60 * 1000 });
    for (const [path, content] of Object.entries(files)) {
        await sandbox.files.write(path, content);
    }
    await installDependencies(sandbox, files);
    await writeProjectAssets(sandbox, projectId);
    // Installing packages can take the dev server down; bring it back.
    if (files["package.json"]) await ensureDevServer(sandbox, 30_000);
    return `https://${sandbox.getHost(3000)}`;
}

/** True when the preview still answers; E2B returns 502 once a sandbox has stopped. */
export async function isPreviewAlive(url: string): Promise<boolean> {
    try {
        const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000) });
        return res.status !== 502 && res.status !== 404;
    } catch {
        return false;
    }
}
