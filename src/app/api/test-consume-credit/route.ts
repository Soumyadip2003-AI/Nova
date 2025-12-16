import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { consumeCreditsForUser, getUsageStatus } from "@/lib/usage";

export async function POST() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get usage before
        const beforeUsage = await getUsageStatus();
        console.log("Before consuming:", beforeUsage);

        // Try to consume credits
        const result = await consumeCreditsForUser(userId);
        console.log("Credit consumed, result:", result);

        // Get usage after
        const afterUsage = await getUsageStatus();
        console.log("After consuming:", afterUsage);

        return NextResponse.json({
            success: true,
            before: beforeUsage,
            after: afterUsage,
            consumed: beforeUsage.remainingPoints - afterUsage.remainingPoints,
        });
    } catch (error) {
        console.error("Test consume credit error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            errorName: error instanceof Error ? error.name : undefined,
        }, { status: 500 });
    }
}
