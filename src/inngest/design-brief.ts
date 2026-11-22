import OpenAI from "openai";
import type { Attachment, FileAttachment } from "@/lib/attachments";
import { readLink } from "@/lib/link-reader";
import { appAssets, readBlob, type AppAsset } from "@/lib/project-files";

/* Turns the user's design references (screenshots, recording frames, PDFs,
   text files, links) into a written brief for the build agent. The agent
   library only sends text, so one vision call reads the references and the
   agent works from its description; this works with every build model. */

const MAX_IMAGES = 16;
const MAX_PDFS = 3;
const MAX_TEXT_CHARS = 15_000;

const BRIEF_INSTRUCTIONS = `You are a senior product designer handing references to a developer who cannot see them.
Study every reference and write a build brief for the user's request. Be concrete and visual, not generic:
1. What the references show (one line each).
2. Layout: the sections or screens in order, with their structure.
3. Colour palette with hex values (estimate from the images when needed).
4. Typography: font style, sizes, weights; name a similar Google font.
5. Components, states and interactions to reproduce (from recording frames: the flow between them).
6. Copy and content to reuse.
7. Where to use the user's uploaded images, by their path (listed below).
If a reference conflicts with the user's request, the request wins. Do not invent references. At most 700 words.`;

export type DesignBrief = { brief: string; assets: AppAsset[]; notes: string[] };

export async function buildDesignBrief(opts: {
    prompt: string;
    attachments: Attachment[];
    isPro: boolean;
    log: (line: string) => Promise<void>;
}): Promise<DesignBrief> {
    const { prompt, attachments, isPro, log } = opts;
    const content: OpenAI.Responses.ResponseInputContent[] = [];
    const notes: string[] = [];
    const assets = appAssets(attachments);
    let images = 0;
    let pdfs = 0;

    const files = attachments.filter((a): a is FileAttachment => a.kind === "file");
    const recordings = new Set(files.filter((f) => f.from).map((f) => f.from!));
    for (const rec of recordings) await log(`Watched ${rec} (${files.filter((f) => f.from === rec).length} frames)`);

    for (const file of files) {
        const label = file.from ? `Frame from screen recording "${file.from}"` : `Uploaded file "${file.name}"`;
        if (file.contentType.startsWith("image/") && file.contentType !== "image/svg+xml") {
            if (images >= MAX_IMAGES) { notes.push(`Skipped ${file.name}: more than ${MAX_IMAGES} images.`); continue; }
            const data = await readBlob(file.pathname);
            if (!data) { notes.push(`Could not read ${file.name}.`); continue; }
            images++;
            content.push({ type: "input_text", text: label });
            content.push({ type: "input_image", image_url: `data:${file.contentType};base64,${data.toString("base64")}`, detail: "high" });
            if (!file.from) await log(`Looked at ${file.name}`);
        } else if (file.contentType === "application/pdf") {
            if (pdfs >= MAX_PDFS) { notes.push(`Skipped ${file.name}: more than ${MAX_PDFS} PDFs.`); continue; }
            const data = await readBlob(file.pathname);
            if (!data) { notes.push(`Could not read ${file.name}.`); continue; }
            pdfs++;
            content.push({ type: "input_text", text: label });
            content.push({ type: "input_file", filename: file.name, file_data: `data:application/pdf;base64,${data.toString("base64")}` });
            await log(`Read ${file.name}`);
        } else {
            // Text, code, data and SVG files are read as text.
            const data = await readBlob(file.pathname);
            if (!data) { notes.push(`Could not read ${file.name}.`); continue; }
            const text = data.toString("utf8").slice(0, MAX_TEXT_CHARS);
            content.push({ type: "input_text", text: `${label}:\n${text}` });
            await log(`Read ${file.name}`);
        }
    }

    for (const link of attachments.filter((a) => a.kind === "link")) {
        const page = await readLink(link.url);
        content.push({ type: "input_text", text: page.summary });
        await log(page.ok ? `Read ${link.url}: ${page.title.slice(0, 80)}` : `Could not read ${link.url}`);
        if (!page.ok) notes.push(page.summary);
    }

    const assetList = assets.length
        ? `\nThe user's images are available in the app at: ${assets.map((a) => a.path.replace(/^public/, "")).join(", ")}`
        : "";
    content.unshift({ type: "input_text", text: `User's request: ${prompt}${assetList}` });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
        model: isPro ? "gpt-5.1" : "gpt-4o-mini",
        instructions: BRIEF_INSTRUCTIONS,
        input: [{ role: "user", content }],
        max_output_tokens: 3000,
        ...(isPro ? { reasoning: { effort: "low" as const } } : {}),
        store: false,
    });
    return { brief: response.output_text.trim(), assets, notes };
}

/** The build agent's input: the request, the brief and where the user's images are. */
export function promptWithBrief(prompt: string, design: DesignBrief): string {
    const assets = design.assets.length
        ? `\nThe user's uploaded images are already in the project; use them where the brief says (paths as served): ${design.assets.map((a) => a.path.replace(/^public/, "")).join(", ")}`
        : "";
    return `${prompt}

<design_references>
The user attached design references. A designer studied them and wrote this brief; follow it closely.
${design.brief}${assets}
</design_references>`;
}
