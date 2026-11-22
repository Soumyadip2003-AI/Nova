import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { PLAN_LIMITS, UPLOAD_CONTENT_TYPES, uploadPrefix } from "@/lib/attachments";
import { getUsageStatusForUser } from "@/lib/usage";

// Issues short-lived tokens so the browser uploads design references straight
// to the private Blob store (Vercel functions cap request bodies at 4.5 MB).
// A token only allows the signed-in user's own folder, the allowed types and
// their plan's size limit.
export async function POST(request: NextRequest) {
    const body = (await request.json()) as HandleUploadBody;
    const { userId } = await auth();
    try {
        const result = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                if (!userId) throw new Error("Sign in to upload files.");
                if (!pathname.startsWith(uploadPrefix(userId)) || pathname.includes("..")) throw new Error("Invalid upload path.");
                const { plan } = await getUsageStatusForUser(userId);
                return {
                    allowedContentTypes: UPLOAD_CONTENT_TYPES,
                    maximumSizeInBytes: PLAN_LIMITS[plan === "PRO" ? "PRO" : "FREE"].bytes,
                    addRandomSuffix: true,
                };
            },
            // Blob's completion callback cannot reach this route (it is behind
            // sign-in); the browser reports the finished upload with the message.
            onUploadCompleted: async () => {},
        });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
    }
}
