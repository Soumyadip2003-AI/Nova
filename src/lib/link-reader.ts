import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isFetchableUrl } from "./attachments";

/* Reads a reference link the user gave, for the design brief: title, colours,
   fonts, headings and some text. The server fetches it, so every hop is
   checked to stop links that point at private or internal addresses. */

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;

/** True for loopback, private, link-local, CGNAT, multicast and reserved addresses. */
export function isPrivateIp(ip: string): boolean {
    const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (isIP(ip) === 4) {
        const [a, b] = ip.split(".").map(Number);
        return a === 0 || a === 10 || a === 127 || a >= 224 ||
            (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
            (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
    }
    const v6 = ip.toLowerCase();
    return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith("ff");
}

async function assertPublicHost(url: URL) {
    if (!isFetchableUrl(url.href)) throw new Error("not a public web address");
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) throw new Error("points at a private address");
}

// shortcut: the host is checked before fetch resolves it again (DNS rebinding window); pin the resolved IP with a custom dispatcher if this is ever abused.
async function safeFetch(raw: string, accept: string): Promise<{ url: string; type: string; body: string }> {
    let url = new URL(raw);
    for (let hop = 0; hop < 4; hop++) {
        await assertPublicHost(url);
        const res = await fetch(url, {
            redirect: "manual",
            signal: AbortSignal.timeout(TIMEOUT_MS),
            headers: { accept, "user-agent": "NovaReferenceReader/1.0 (+https://nova-five-black.vercel.app)" },
        });
        const location = res.headers.get("location");
        if (res.status >= 300 && res.status < 400 && location) {
            url = new URL(location, url);
            continue;
        }
        if (!res.ok) throw new Error(`answered ${res.status}`);
        const reader = res.body?.getReader();
        let body = "";
        const decoder = new TextDecoder();
        let size = 0;
        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            body += decoder.decode(value, { stream: true });
            if (size > MAX_BYTES) { await reader.cancel(); break; }
        }
        return { url: url.href, type: res.headers.get("content-type") ?? "", body };
    }
    throw new Error("too many redirects");
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const textOf = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** The design-relevant facts in a page and its stylesheets. Pure, for testing. */
export function summarizePage(html: string, css: string[] = []) {
    const meta = (name: string) =>
        html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)`, "i"))?.[1];
    const allCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n") + "\n" + css.join("\n") +
        "\n" + [...html.matchAll(/style=["']([^"']*)["']/gi)].map((m) => m[1]).join(";");

    const colours = new Map<string, number>();
    for (const m of allCss.matchAll(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
        let hex = m[0].toLowerCase();
        if (hex.length === 4) hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
        colours.set(hex, (colours.get(hex) ?? 0) + 1);
    }
    const fonts = new Set<string>();
    for (const m of allCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
        const first = m[1].split(",")[0].replace(/["']/g, "").trim();
        if (first && !first.startsWith("var(") && !/^(inherit|initial|sans-serif|serif|monospace|system-ui)$/i.test(first)) fonts.add(first);
    }
    for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)) {
        fonts.add(decodeURIComponent(m[1]).split(":")[0].replace(/\+/g, " "));
    }
    const body = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ");
    const headings = [...body.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => `h${m[1]}: ${textOf(m[2])}`).filter((h) => h.length > 4).slice(0, 20);
    const nav = [...(body.match(/<nav[\s\S]*?<\/nav>/i)?.[0] ?? "").matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => textOf(m[1])).filter(Boolean).slice(0, 12);

    return {
        title: textOf(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
        description: decode(meta("description") ?? meta("og:description") ?? ""),
        themeColor: meta("theme-color") ?? "",
        colours: [...colours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([hex]) => hex),
        fonts: [...fonts].slice(0, 6),
        headings,
        nav,
        text: textOf(body.match(/<body[\s\S]*<\/body>/i)?.[0] ?? body).slice(0, 2500),
    };
}

/** A short written summary of a reference page, or why it could not be read. */
export async function readLink(raw: string): Promise<{ ok: boolean; title: string; summary: string }> {
    try {
        const page = await safeFetch(raw, "text/html,application/xhtml+xml");
        if (!/html/i.test(page.type)) return { ok: false, title: raw, summary: `${raw}: not a web page (${page.type || "unknown type"}).` };
        const sheets = [...page.body.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)/gi)].map((m) => m[1]).slice(0, 2);
        const css = await Promise.all(sheets.map((href) =>
            safeFetch(new URL(href, page.url).href, "text/css").then((r) => r.body.slice(0, 400_000)).catch(() => "")));
        const s = summarizePage(page.body, css);
        const summary = [
            `Reference page: ${page.url}`,
            s.title && `Title: ${s.title}`,
            s.description && `Description: ${s.description}`,
            s.themeColor && `Theme colour: ${s.themeColor}`,
            s.colours.length && `Most used colours: ${s.colours.join(", ")}`,
            s.fonts.length && `Fonts: ${s.fonts.join(", ")}`,
            s.nav.length && `Navigation: ${s.nav.join(" | ")}`,
            s.headings.length && `Headings:\n${s.headings.join("\n")}`,
            s.text && `Text (start): ${s.text}`,
        ].filter(Boolean).join("\n");
        return { ok: true, title: s.title || page.url, summary };
    } catch (e) {
        return { ok: false, title: raw, summary: `${raw}: could not be read (${e instanceof Error ? e.message : "error"}).` };
    }
}
