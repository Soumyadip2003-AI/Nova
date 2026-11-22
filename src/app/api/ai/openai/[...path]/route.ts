import { NextRequest, NextResponse } from "next/server";

// Pass-through for the build agent's OpenAI calls. agent-kit only reports
// "unsuccessful status code: 400" and drops OpenAI's error body, so model
// errors could not be diagnosed. This forwards the call unchanged and logs the
// body of any error response. The caller's own Authorization header is used;
// no server key is added, so the route is useless without a valid key.
const ALLOWED = new Set(["chat/completions"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const path = (await params).path.join("/");
    const auth = req.headers.get("authorization") ?? "";
    if (!ALLOWED.has(path) || !auth.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.text();
    const upstream = await fetch(`https://api.openai.com/v1/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: auth },
        body,
    });
    const text = await upstream.text();

    if (!upstream.ok) {
        let model = "unknown";
        try { model = JSON.parse(body).model ?? model; } catch {}
        console.error(`OpenAI ${upstream.status} for model ${model}: ${text.slice(0, 2000)}`);
    }

    return new NextResponse(text, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
}
