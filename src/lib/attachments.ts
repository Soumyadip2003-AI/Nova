import { z } from "zod";

/* Design references a user sends with a message: files uploaded to the
   private Blob store, and links. Screen recordings never reach the server as
   video: the browser samples a few frames and uploads those as images, each
   carrying the recording's name in `from`. */

export const MAX_LINKS = 5;
export const RECORDING_FRAMES = 6;

export const PLAN_LIMITS = {
    FREE: { files: 3, bytes: 10 * 1024 * 1024, recordings: false },
    PRO: { files: 10, bytes: 50 * 1024 * 1024, recordings: true },
} as const;
export type Plan = keyof typeof PLAN_LIMITS;

/** Media types the upload token allows. Code and data files are sent as text/plain. */
export const UPLOAD_CONTENT_TYPES = [
    "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
    "application/pdf", "application/json", "text/*",
];

const TEXT_EXTENSIONS = new Set([
    "txt", "md", "markdown", "csv", "tsv", "json", "html", "htm", "css", "scss",
    "js", "jsx", "ts", "tsx", "mjs", "cjs", "vue", "svelte", "xml", "yaml", "yml", "toml", "sql", "py",
]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

export type FileKind = "image" | "recording" | "pdf" | "text" | "unsupported";

/** What Nova can do with a file the user picked, from its type and name. */
export function fileKind(type: string, name: string): FileKind {
    const ext = name.toLowerCase().split(".").pop() ?? "";
    if (IMAGE_TYPES.has(type) || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
    if (type.startsWith("video/") || ["mp4", "mov", "webm", "m4v"].includes(ext)) return "recording";
    if (type === "application/pdf" || ext === "pdf") return "pdf";
    if (type.startsWith("text/") || type === "application/json" || TEXT_EXTENSIONS.has(ext)) return "text";
    return "unsupported";
}

/** The type to upload a file as; code files often have no browser type. */
export function uploadType(kind: FileKind, type: string, name: string): string {
    if (kind === "pdf") return "application/pdf";
    if (kind === "text") return type.startsWith("text/") || type === "application/json" ? type : "text/plain";
    if (kind === "image" && !type) return name.toLowerCase().endsWith(".svg") ? "image/svg+xml" : "image/png";
    return type;
}

export const uploadPrefix = (userId: string) => `uploads/${userId}/`;

const fileAttachment = z.object({
    kind: z.literal("file"),
    pathname: z.string().min(1).max(500),
    name: z.string().min(1).max(200),
    contentType: z.string().min(1).max(100),
    size: z.number().int().nonnegative(),
    /** Set on frames sampled from a screen recording: the recording's name. */
    from: z.string().max(200).optional(),
});
const linkAttachment = z.object({ kind: z.literal("link"), url: z.string().url().max(2000) });

export const attachmentSchema = z.discriminatedUnion("kind", [fileAttachment, linkAttachment]);
export const attachmentsSchema = z.array(attachmentSchema).max(80);
export type Attachment = z.infer<typeof attachmentSchema>;
export type FileAttachment = z.infer<typeof fileAttachment>;
export type LinkAttachment = z.infer<typeof linkAttachment>;

/** A link Nova may fetch: http(s) on the default port, no credentials, not a bare internal host. */
export function isFetchableUrl(raw: string): boolean {
    let url: URL;
    try { url = new URL(raw); } catch { return false; }
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host.includes(".") && !host.endsWith(".local") && !host.endsWith(".internal") && host !== "localhost";
}

/**
 * Server-side check of what a client sent. Returns a reason the user can act
 * on, or null when the attachments are acceptable.
 */
export function attachmentProblem(list: Attachment[], userId: string, plan: Plan): string | null {
    const limits = PLAN_LIMITS[plan];
    const files = list.filter((a): a is FileAttachment => a.kind === "file");
    const links = list.filter((a): a is LinkAttachment => a.kind === "link");

    if (files.some((f) => !f.pathname.startsWith(uploadPrefix(userId)))) return "One of the files does not belong to you.";
    if (files.some((f) => f.size > limits.bytes)) return `Each file can be up to ${limits.bytes / 1024 / 1024} MB on your plan.`;
    if (files.some((f) => f.from) && !limits.recordings) return "Screen recordings are a Pro feature.";

    // A recording's frames count as one file.
    const count = new Set(files.map((f) => (f.from ? `rec:${f.from}` : f.pathname))).size;
    if (count > limits.files) return `You can attach up to ${limits.files} files on your plan.`;
    if (files.filter((f) => f.from).length > limits.files * RECORDING_FRAMES) return "Too many recording frames.";

    if (links.length > MAX_LINKS) return `You can add up to ${MAX_LINKS} links.`;
    if (links.some((l) => !isFetchableUrl(l.url))) return "One of the links is not a public web address.";
    return null;
}
