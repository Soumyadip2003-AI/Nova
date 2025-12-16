import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Test 1: Direct database query
        const usage = await prisma.usage.findUnique({
            where: { key: userId },
        });

        // Test 2: Check if user exists
        const allUsage = await prisma.usage.findMany({
            take: 5,
        });

        return NextResponse.json({
            success: true,
            userId,
            userUsage: usage,
            sampleRecords: allUsage,
            message: "Database connection working"
        });
    } catch (error) {
        console.error("Test usage error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
