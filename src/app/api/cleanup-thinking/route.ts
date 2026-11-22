import { NextResponse } from "next/server";
import { stopStalledBuilds } from "@/inngest/cleanup-thinking";

/**
 * Manual trigger for the stalled-build cleanup (development only).
 * GET /api/cleanup-thinking
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    return NextResponse.json({ success: true, ...(await stopStalledBuilds()) });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
