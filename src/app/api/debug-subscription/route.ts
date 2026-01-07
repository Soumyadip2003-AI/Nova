import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { userId, has } = await auth();
    const user = await currentUser();

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Test various plan names with has()
    const planChecks = {
        "pro": has?.({ plan: "pro" }),
        "Pro": has?.({ plan: "Pro" }),
        "PRO": has?.({ plan: "PRO" }),
        "premium": has?.({ plan: "premium" }),
        "Premium": has?.({ plan: "Premium" }),
        "free": has?.({ plan: "free" }),
        "Free": has?.({ plan: "Free" }),
    };

    // Feature checks (another way Clerk can gate access)
    const featureChecks = {
        "pro": has?.({ feature: "pro" }),
        "premium": has?.({ feature: "premium" }),
        "unlimited": has?.({ feature: "unlimited" }),
    };

    return NextResponse.json({
        userId,
        hasFunction: !!has,
        planChecks,
        featureChecks,
        publicMetadata: user?.publicMetadata,
        privateMetadata: user?.privateMetadata,
        message: "Check which plan/feature returns true - that's your identifier in Clerk"
    });
}
