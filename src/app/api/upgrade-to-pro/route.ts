import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { upgradeUserToPro } from "@/lib/usage";

// POST /api/upgrade-to-pro - Upgrade current user to Pro
// This endpoint can be called after successful Clerk Commerce payment
export async function POST() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const usage = await upgradeUserToPro(userId);

        return NextResponse.json({
            success: true,
            message: "Successfully upgraded to Pro",
            usage: {
                plan: usage.plan,
                points: usage.points,
                expire: usage.expire,
            }
        });
    } catch (error) {
        console.error("Error upgrading to Pro:", error);
        return NextResponse.json(
            { error: "Failed to upgrade" },
            { status: 500 }
        );
    }
}
