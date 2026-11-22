import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { downgradeUserToFree, upgradeUserToPro } from "@/lib/usage";

const parseTokens = (value?: string) =>
  value
    ? value
        .split(",")
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean)
    : [];

const PRO_PLAN_TOKENS = new Set(
  [
    "pro",
    ...parseTokens(process.env.CLERK_PRO_PLAN_SLUG),
    ...parseTokens(process.env.CLERK_PRO_PLAN_NAME),
    ...parseTokens(process.env.CLERK_PRO_PLAN_ID),
  ]
);

const ACTIVE_STATUSES = new Set(["active", "past_due", "upcoming"]);
const INACTIVE_STATUSES = new Set([
  "canceled",
  "ended",
  "expired",
  "abandoned",
  "incomplete",
]);

const isProPlan = (plan?: { slug?: string; name?: string; id?: string } | null) => {
  if (!plan) return false;
  const tokens = [plan.slug, plan.name, plan.id]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());
  return tokens.some((token) => PRO_PLAN_TOKENS.has(token));
};

const getUserId = (data: { payer?: { user_id?: string } }) =>
  data?.payer?.user_id ?? null;

export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  // Account deleted in Clerk: erase that user's projects (messages and
  // versions cascade) and credit record, as the privacy policy promises.
  if (type === "user.deleted") {
    const deletedId = (data as { id?: string }).id;
    if (deletedId) {
      const { prisma } = await import("@/lib/db");
      await prisma.$transaction([
        prisma.project.deleteMany({ where: { userId: deletedId } }),
        prisma.usage.deleteMany({ where: { key: deletedId } }),
      ]);
    }
    return NextResponse.json({ received: true });
  }

  if (!type.startsWith("subscription")) {
    return NextResponse.json({ received: true });
  }

  const userId = getUserId(data as { payer?: { user_id?: string } });
  if (!userId) {
    console.warn("Clerk webhook missing payer user_id");
    return NextResponse.json({ received: true });
  }

  const items = Array.isArray((data as { items?: unknown }).items)
    ? ((data as { items: Array<{ plan?: { slug?: string; name?: string; id?: string } | null; status?: string }> }).items)
    : [data as { plan?: { slug?: string; name?: string; id?: string } | null; status?: string }];

  const hasProPlan = items.some((item) => isProPlan(item.plan ?? null));
  const status = (data as { status?: string }).status ?? items[0]?.status;

  if (hasProPlan && status && ACTIVE_STATUSES.has(status)) {
    await upgradeUserToPro(userId);
  }

  if (hasProPlan && status && INACTIVE_STATUSES.has(status)) {
    await downgradeUserToFree(userId);
  }

  return NextResponse.json({ received: true });
}
