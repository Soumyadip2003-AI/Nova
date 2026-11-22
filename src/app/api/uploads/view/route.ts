import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { del, get } from "@vercel/blob";
import { uploadPrefix } from "@/lib/attachments";

const ownPath = (userId: string | null, pathname: string) =>
    !!userId && pathname.startsWith(uploadPrefix(userId)) && !pathname.includes("..");

// Removing a file from the composer before sending deletes it.
export async function DELETE(request: NextRequest) {
    const { userId } = await auth();
    const pathname = request.nextUrl.searchParams.get("p") ?? "";
    if (!ownPath(userId, pathname)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await del(pathname);
    return new NextResponse(null, { status: 204 });
}

// Shows one of the signed-in user's own uploads (chat thumbnails). Files are
// private in Blob, so they are streamed through here after an ownership check.
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    const pathname = request.nextUrl.searchParams.get("p") ?? "";
    if (!ownPath(userId, pathname)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const file = await get(pathname, { access: "private" });
    if (!file || file.statusCode !== 200 || !file.stream) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // SVGs can carry scripts: the sandbox CSP stops them running when opened directly.
    return new NextResponse(file.stream, {
        headers: {
            "content-type": file.blob.contentType,
            "cache-control": "private, max-age=3600",
            "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "x-content-type-options": "nosniff",
        },
    });
}
