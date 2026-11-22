import type { Sandbox } from "@e2b/code-interpreter";
import { del, get, list } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { attachmentsSchema, uploadPrefix, type Attachment, type FileAttachment } from "@/lib/attachments";

/* What a sandbox needs besides the saved source files: the images the user
   uploaded (binary, so kept in Blob, not in the saved files) and the
   dependencies a full-stack app added to package.json. Used when a build
   starts and when a stopped preview is started again. */

export async function readBlob(pathname: string): Promise<Buffer | null> {
    const file = await get(pathname, { access: "private" });
    if (!file || file.statusCode !== 200 || !file.stream) return null;
    return Buffer.from(await new Response(file.stream).arrayBuffer());
}

/** Where an uploaded image is copied in the generated app (served as /uploads/...). */
export function assetPath(file: FileAttachment): string {
    const base = file.pathname.split("/").pop() ?? file.name;
    return `public/uploads/${base.replace(/[^\w.-]+/g, "-").toLowerCase()}`;
}

export type AppAsset = { pathname: string; path: string };

/** Uploaded images the generated app can use; recording frames and PDFs are references only. */
export function appAssets(attachments: Attachment[]): AppAsset[] {
    return attachments
        .filter((a): a is FileAttachment => a.kind === "file" && !a.from && a.contentType.startsWith("image/"))
        .map((f) => ({ pathname: f.pathname, path: assetPath(f) }));
}

/** Copies every image the user uploaded in this project into the sandbox. */
export async function writeProjectAssets(sandbox: Sandbox, projectId: string): Promise<number> {
    const messages = await prisma.message.findMany({
        where: { projectId, role: "USER", attachments: { not: Prisma.DbNull } },
        select: { attachments: true },
    });
    const assets = messages.flatMap((m) => {
        const parsed = attachmentsSchema.safeParse(m.attachments);
        return parsed.success ? appAssets(parsed.data) : [];
    });
    let written = 0;
    for (const asset of assets) {
        const data = await readBlob(asset.pathname).catch(() => null);
        if (!data) continue;
        await sandbox.files.write(asset.path, new Blob([new Uint8Array(data)]));
        written++;
    }
    return written;
}

/** Uploaded files referenced by a project's messages, for deleting them with the project. */
export async function projectUploadPathnames(projectId: string): Promise<string[]> {
    const messages = await prisma.message.findMany({
        where: { projectId, attachments: { not: Prisma.DbNull } },
        select: { attachments: true },
    });
    return messages.flatMap((m) => {
        const parsed = attachmentsSchema.safeParse(m.attachments);
        return parsed.success ? parsed.data.flatMap((a) => (a.kind === "file" ? [a.pathname] : [])) : [];
    });
}

export async function deleteUploads(pathnames: string[]) {
    for (let i = 0; i < pathnames.length; i += 100) await del(pathnames.slice(i, i + 100));
}

/** Every file a user ever uploaded, including ones never sent; for account deletion. */
export async function deleteUserUploads(userId: string) {
    let cursor: string | undefined;
    do {
        const page = await list({ prefix: uploadPrefix(userId), cursor, limit: 1000 });
        await deleteUploads(page.blobs.map((b) => b.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
}

/** Installs the project's dependencies when it saved its own package.json. */
export async function installDependencies(sandbox: Sandbox, files: Record<string, string>) {
    if (!files["package.json"]) return;
    await sandbox.commands.run("npm install --no-audit --no-fund --loglevel=error", { timeoutMs: 240_000 });
}
