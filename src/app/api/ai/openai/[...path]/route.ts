import { NextRequest, NextResponse } from "next/server";
import { chatToResponsesRequest, needsResponsesApi, responsesToChatResponse } from "@/lib/openai-responses";

// Pass-through for the build agent's OpenAI calls. agent-kit only reports
// "unsuccessful status code: 400" and drops OpenAI's error body, so model
// errors could not be diagnosed. This forwards the call and logs the body of
// any error response. Calls that set a reasoning effort go to /v1/responses,
// the only endpoint that accepts tools with an effort (see openai-responses.ts).
// The caller's own Authorization header is used; no server key is added, so
// the route is useless without a valid key.
const ALLOWED = new Set(["chat/completions"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const path = (await params).path.join("/");
    const auth = req.headers.get("authorization") ?? "";
    if (!ALLOWED.has(path) || !auth.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.text();
    let chat: Record<string, unknown> = {};
    try { chat = JSON.parse(body); } catch {}
    const viaResponses = needsResponsesApi(chat);

    const upstream = await fetch(`https://api.openai.com/v1/${viaResponses ? "responses" : path}`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: auth },
        body: viaResponses ? JSON.stringify(chatToResponsesRequest(chat)) : body,
    });
    const text = await upstream.text();

    if (!upstream.ok) {
        console.error(`OpenAI ${upstream.status} for model ${chat.model ?? "unknown"}: ${text.slice(0, 2000)}`);
    }

    if (viaResponses && upstream.ok) {
        return NextResponse.json(responsesToChatResponse(JSON.parse(text)));
    }
    return new NextResponse(text, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
}
