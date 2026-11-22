"use client";

import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import { FileTextIcon, ImageIcon, LinkIcon, Loader2Icon, PaperclipIcon, PlusIcon, VideoIcon, XIcon, AlertCircleIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MAX_LINKS, PLAN_LIMITS, RECORDING_FRAMES, fileKind, isFetchableUrl, uploadPrefix, uploadType,
    type Attachment, type FileKind,
} from "@/lib/attachments";

/* Design references in the composer: upload screenshots, screen recordings,
   PDFs and text or code files from the computer (button, drag and drop, or
   paste), and add links. Files go straight from the browser to private Blob
   storage; recordings are sampled into still frames first. */

type Item = {
    id: string;
    label: string;
    kind: FileKind | "link";
    status: "uploading" | "ready" | "error";
    error?: string;
    preview?: string;
    attachments: Attachment[];
};

const MAX_IMAGE_SIDE = 2400;

/** Large photos and screenshots are scaled down before upload; the model sees no more detail than this. */
async function shrinkImage(file: File): Promise<Blob> {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024) { bitmap.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/webp", 0.9));
}

/** Evenly spaced still frames from a screen recording, as WebP images. */
async function sampleFrames(file: File, count: number): Promise<Blob[]> {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.src = url;
    try {
        await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error("This recording could not be opened in the browser."));
        });
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const frames: Blob[] = [];
        for (let i = 0; i < count; i++) {
            video.currentTime = duration * ((i + 0.5) / count);
            await new Promise((resolve) => { video.onseeked = resolve; });
            canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
            if (frame) frames.push(frame);
        }
        return frames;
    } finally {
        URL.revokeObjectURL(url);
    }
}

const safeName = (name: string) => name.replace(/[^\w.-]+/g, "-").slice(-80) || "file";

export function useAttachments() {
    const trpc = useTRPC();
    const { userId } = useAuth();
    const { data: usage } = useQuery({ ...trpc.usage.status.queryOptions(), enabled: !!userId });
    const limits = PLAN_LIMITS[usage?.plan === "PRO" ? "PRO" : "FREE"];
    const [items, setItems] = useState<Item[]>([]);
    const itemsRef = useRef(items);
    itemsRef.current = items;

    // Object URLs for image previews are released when the composer goes away.
    useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

    const update = (id: string, patch: Partial<Item>) =>
        setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

    const uploadOne = useCallback(async (blob: Blob, name: string, contentType: string) => {
        const result = await upload(`${uploadPrefix(userId!)}${safeName(name)}`, blob, {
            access: "private",
            handleUploadUrl: "/api/uploads",
            contentType,
        });
        return { pathname: result.pathname, size: blob.size };
    }, [userId]);

    const addFiles = useCallback((files: File[]) => {
        if (!userId) return;
        let fileCount = itemsRef.current.filter((i) => i.kind !== "link" && i.status !== "error").length;
        for (const file of files) {
            const kind = fileKind(file.type, file.name);
            const id = crypto.randomUUID();
            const base: Item = {
                id, label: file.name, kind, status: "uploading", attachments: [],
                preview: kind === "image" ? URL.createObjectURL(file) : undefined,
            };
            const fail = (error: string) => setItems((list) => [...list, { ...base, status: "error", error }]);

            if (kind === "unsupported") { fail("Nova can read images, screen recordings, PDFs and text or code files."); continue; }
            if (kind === "recording" && !limits.recordings) { fail("Screen recordings are a Pro feature."); continue; }
            if (file.size > limits.bytes) { fail(`Files can be up to ${limits.bytes / 1024 / 1024} MB on your plan.`); continue; }
            if (fileCount >= limits.files) { fail(`You can attach up to ${limits.files} files on your plan.`); continue; }
            fileCount++;
            setItems((list) => [...list, base]);

            (async () => {
                try {
                    if (kind === "recording") {
                        const frames = await sampleFrames(file, RECORDING_FRAMES);
                        if (!frames.length) throw new Error("No frames could be read from this recording.");
                        const attachments: Attachment[] = [];
                        for (const [i, frame] of frames.entries()) {
                            const up = await uploadOne(frame, `${file.name}-frame-${i + 1}.webp`, "image/webp");
                            attachments.push({ kind: "file", name: `${file.name} frame ${i + 1}`, contentType: "image/webp", from: file.name, ...up });
                        }
                        update(id, { status: "ready", attachments });
                    } else {
                        const blob = kind === "image" ? await shrinkImage(file) : file;
                        const type = blob === file ? uploadType(kind, file.type, file.name) : blob.type;
                        const up = await uploadOne(blob, file.name, type);
                        update(id, { status: "ready", attachments: [{ kind: "file", name: file.name, contentType: type, ...up }] });
                    }
                } catch (error) {
                    update(id, { status: "error", error: error instanceof Error ? error.message : "Upload failed" });
                }
            })();
        }
    }, [userId, limits, uploadOne]);

    const addLink = useCallback((raw: string): string | null => {
        const url = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
        if (!isFetchableUrl(url)) return "Enter a public web address, like stripe.com.";
        if (itemsRef.current.filter((i) => i.kind === "link").length >= MAX_LINKS) return `You can add up to ${MAX_LINKS} links.`;
        setItems((list) => [...list, {
            id: crypto.randomUUID(), label: url.replace(/^https?:\/\//, ""), kind: "link", status: "ready",
            attachments: [{ kind: "link", url }],
        }]);
        return null;
    }, []);

    const remove = useCallback((id: string) => {
        const gone = itemsRef.current.find((i) => i.id === id);
        if (gone?.preview) URL.revokeObjectURL(gone.preview);
        // Not sent, so not kept: delete the uploaded copy too.
        for (const a of gone?.attachments ?? []) {
            if (a.kind === "file") fetch(`/api/uploads/view?p=${encodeURIComponent(a.pathname)}`, { method: "DELETE" }).catch(() => {});
        }
        setItems((list) => list.filter((i) => i.id !== id));
    }, []);

    const clear = useCallback(() => setItems((list) => {
        list.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
        return [];
    }), []);

    const onPaste = useCallback((e: ClipboardEvent) => {
        const files = [...e.clipboardData.files];
        if (files.length) { e.preventDefault(); addFiles(files); }
    }, [addFiles]);

    const [dragging, setDragging] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const dropProps = {
        onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } },
        onDragLeave: (e: DragEvent) => { if (e.currentTarget === e.target) setDragging(false); },
        onDrop: (e: DragEvent) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            setDragging(false);
            addFiles([...e.dataTransfer.files]);
        },
    };

    return {
        items,
        attachments: items.filter((i) => i.status === "ready").flatMap((i) => i.attachments),
        uploading: items.some((i) => i.status === "uploading"),
        enabled: !!userId,
        addFiles, addLink, remove, clear, onPaste, dropProps, dragging, linkOpen, setLinkOpen,
    };
}

export type AttachmentsState = ReturnType<typeof useAttachments>;

const kindIcon = { image: ImageIcon, recording: VideoIcon, pdf: FileTextIcon, text: FileTextIcon, unsupported: AlertCircleIcon, link: LinkIcon };

/** The chosen references, shown above the message box. */
export function AttachmentTray({ state, className }: { state: AttachmentsState; className?: string }) {
    if (!state.items.length && !state.linkOpen) return null;
    return (
        <div className={cn("flex flex-col gap-2 px-3.5 pt-3", className)}>
            {state.linkOpen && <LinkField state={state} />}
            {state.items.length > 0 && <ItemList state={state} />}
        </div>
    );
}

/** Inline link entry. Not a nested <form>: it sits inside the composer's form. */
function LinkField({ state }: { state: AttachmentsState }) {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // The + menu hands focus back to its button as it closes; take it after that.
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 60);
        return () => clearTimeout(t);
    }, []);
    const add = () => {
        const problem = state.addLink(value);
        setError(problem);
        if (!problem) { setValue(""); state.setLinkOpen(false); }
    };
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <label htmlFor="reference-link" className="sr-only">Reference link</label>
                <input
                    ref={inputRef}
                    id="reference-link"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); add(); }
                        if (e.key === "Escape") { e.preventDefault(); state.setLinkOpen(false); }
                    }}
                    placeholder="A site whose look you like, e.g. stripe.com"
                    aria-invalid={!!error}
                    aria-describedby={error ? "reference-link-error" : undefined}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="button" onClick={add} className="h-9 rounded-xl px-3">Add</Button>
                <Button type="button" variant="ghost" onClick={() => state.setLinkOpen(false)} className="h-9 rounded-xl px-3">Cancel</Button>
            </div>
            {error && <p id="reference-link-error" className="pl-6 text-xs text-destructive">{error}</p>}
        </div>
    );
}

function ItemList({ state }: { state: AttachmentsState }) {
    return (
        <ul className="flex flex-wrap gap-2" aria-label="Design references">
            {state.items.map((item) => {
                const Icon = kindIcon[item.kind];
                return (
                    <li
                        key={item.id}
                        className={cn(
                            "group flex max-w-[15rem] items-center gap-2 rounded-xl border border-border bg-muted/60 py-1 pl-1 pr-1.5 text-xs",
                            item.status === "error" && "border-destructive/50 bg-destructive-soft",
                        )}
                        title={item.error ?? item.label}
                    >
                        {item.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                            <img src={item.preview} alt="" className="size-7 rounded-lg object-cover" />
                        ) : (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card">
                                <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                            </span>
                        )}
                        <span className="min-w-0">
                            <span className="block truncate font-medium">{item.label}</span>
                            <span className={cn("block truncate text-[11px] text-muted-foreground", item.status === "error" && "text-destructive")}>
                                {item.status === "uploading" ? (item.kind === "recording" ? "Reading frames" : "Uploading")
                                    : item.status === "error" ? item.error
                                    : item.kind === "recording" ? `${item.attachments.length} frames` : item.kind === "link" ? "Link" : "Ready"}
                            </span>
                        </span>
                        {item.status === "uploading" ? (
                            <Loader2Icon className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Uploading" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => state.remove(item.id)}
                                aria-label={`Remove ${item.label}`}
                                className="rounded-md p-0.5 text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <XIcon className="size-3.5" aria-hidden />
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/** The "+" button: upload from the computer, or add a link. */
export function AttachButton({ state, disabled }: { state: AttachmentsState; disabled?: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null);
    if (!state.enabled) return null;

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept="image/*,video/*,.pdf,.txt,.md,.csv,.json,.html,.css,.js,.jsx,.ts,.tsx,.svg,.xml,.yaml,.yml,.sql"
                onChange={(e) => {
                    state.addFiles([...(e.target.files ?? [])]);
                    e.target.value = "";
                }}
            />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={disabled}
                            aria-label="Add design references"
                            className="size-9 shrink-0 rounded-full bg-muted p-0 text-foreground hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <PlusIcon className="size-4" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5">
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-2" onSelect={() => inputRef.current?.click()}>
                            <PaperclipIcon className="size-4" aria-hidden />
                            <span className="flex flex-col">
                                <span className="font-medium">Upload from computer</span>
                                <span className="text-xs text-muted-foreground">Screenshots, recordings, PDFs, files</span>
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 rounded-xl py-2" onSelect={() => state.setLinkOpen(true)}>
                            <LinkIcon className="size-4" aria-hidden />
                            <span className="flex flex-col">
                                <span className="font-medium">Add a link</span>
                                <span className="text-xs text-muted-foreground">A site whose look you like</span>
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
        </>
    );
}

/** References shown on a sent message in the chat. */
export function MessageAttachments({ attachments }: { attachments: unknown }) {
    if (!Array.isArray(attachments) || !attachments.length) return null;
    const list = attachments as Attachment[];
    const recordings = new Map<string, number>();
    const shown: Attachment[] = [];
    for (const a of list) {
        if (a.kind === "file" && a.from) recordings.set(a.from, (recordings.get(a.from) ?? 0) + 1);
        else shown.push(a);
    }
    return (
        <ul className="flex flex-wrap justify-end gap-2" aria-label="Design references">
            {shown.map((a) =>
                a.kind === "link" ? (
                    <li key={a.url}>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
                            <LinkIcon className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{a.url.replace(/^https?:\/\//, "")}</span>
                        </a>
                    </li>
                ) : a.contentType.startsWith("image/") && a.contentType !== "image/svg+xml" ? (
                    <li key={a.pathname}>
                        <a href={`/api/uploads/view?p=${encodeURIComponent(a.pathname)}`} target="_blank" rel="noopener noreferrer" title={a.name}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- private file served through an auth check */}
                            <img src={`/api/uploads/view?p=${encodeURIComponent(a.pathname)}`} alt={a.name} className="h-16 w-24 rounded-xl border border-border object-cover" />
                        </a>
                    </li>
                ) : (
                    <li key={a.pathname} className="flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs">
                        <FileTextIcon className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{a.name}</span>
                    </li>
                ),
            )}
            {[...recordings].map(([name, frames]) => (
                <li key={name} className="flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs">
                    <VideoIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{name}</span>
                    <span className="shrink-0 text-muted-foreground">{frames} frames</span>
                </li>
            ))}
        </ul>
    );
}
