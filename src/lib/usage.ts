import { prisma } from "./db";
import { auth } from "@clerk/nextjs/server";
import { UserPlan } from "@/generated/prisma";

// Plan configuration
const FREE_POINTS = 5;  // Match Clerk pricing page (5 monthly credits)
const PRO_POINTS = 100;
const DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const GENERATION_COST = 1;

export class InsufficientCreditsError extends Error {
    constructor() {
        super("Insufficient credits");
        this.name = "InsufficientCreditsError";
    }
}

// Get credits based on plan
function getCreditsForPlan(plan: UserPlan): number {
    return plan === UserPlan.PRO ? PRO_POINTS : FREE_POINTS;
}

// Check if user has Pro plan using Clerk's has() function (synchronous)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkProPlanFromHas(has: any): boolean {
    if (!has) return false;

    try {
        // Check various plan name formats that Clerk might use
        if (has({ plan: "pro" })) return true;
        if (has({ plan: "Pro" })) return true;
        if (has({ plan: "PRO" })) return true;
    } catch (error) {
        console.error("Error checking has():", error);
    }

    return false;
}

export async function consumeCredits() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    return consumeCreditsForUser(userId);
}

// Version that accepts userId directly (for use in background jobs like Inngest)
// Returns usage status without authentication context
export async function getUsageStatusForUser(userId: string) {
    if (!userId) {
        throw new Error("User ID required");
    }

    const now = new Date();
    const resetDate = new Date(now.getTime() + DURATION);

    // Get or create usage record
    let usage = await prisma.usage.findUnique({
        where: { key: userId },
    });

    // Use stored plan, default to FREE if not found
    const plan = usage?.plan ?? UserPlan.FREE;
    const planCredits = getCreditsForPlan(plan);

    // If no record exists, create one
    if (!usage) {
        usage = await prisma.usage.create({
            data: {
                key: userId,
                points: planCredits,
                expire: resetDate,
                plan: UserPlan.FREE,
            },
        });
    }

    // Check if expired and reset if needed
    if (usage.expire < now) {
        usage = await prisma.usage.update({
            where: { key: userId },
            data: {
                points: planCredits,
                expire: resetDate,
                plan: plan,  // CRITICAL: Update plan on reset to stay in sync
            },
        });
        console.log(`User ${userId} credits expired and reset to ${planCredits} credits with plan ${plan}`);
    }

    return {
        points: usage.points,
        limit: planCredits,
        resetDate: usage.expire,
        plan: usage.plan,
    };
}

// Version that accepts userId directly (for use in background jobs like Inngest)
export async function consumeCreditsForUser(userId: string) {
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const now = new Date();
    const resetDate = new Date(now.getTime() + DURATION);

    // Get stored usage record which includes the plan
    let usage = await prisma.usage.findUnique({
        where: { key: userId },
    });

    // Use stored plan, default to FREE if not found
    const plan = usage?.plan ?? UserPlan.FREE;
    const planCredits = getCreditsForPlan(plan);

    // If no record exists, create one
    if (!usage) {
        usage = await prisma.usage.create({
            data: {
                key: userId,
                points: planCredits,
                expire: resetDate,
                plan: UserPlan.FREE,
            },
        });
    }

    // Check if expired and reset if needed
    if (usage.expire < now) {
        usage = await prisma.usage.update({
            where: { key: userId },
            data: {
                points: planCredits,
                expire: resetDate,
                plan: plan,  // CRITICAL: Update plan on reset to stay in sync
            },
        });
        console.log(`User ${userId} credits expired and reset to ${planCredits} credits with plan ${plan}`);
    }

    // ATOMIC OPERATION: Decrement credits with database-level protection
    // Database has CHECK constraint (points >= 0) to prevent negative credits
    // This prevents race conditions where multiple requests consume credits simultaneously
    try {
        const updatedUsage = await prisma.usage.update({
            where: {
                key: userId,
            },
            data: {
                points: {
                    decrement: GENERATION_COST,
                },
            },
        });

        return updatedUsage;
    } catch (error) {
        // If update failed due to check constraint, user has insufficient credits
        // Prisma error code P2025 = Record not found (shouldn't happen here)
        // PostgreSQL native error code 23514 = CHECK constraint violation
        // Check for both Prisma wrapped errors and raw DB errors
        if (error && typeof error === 'object' && 'code' in error) {
            // Check for PostgreSQL check constraint error (wrapped by Prisma)
            if (error.code === '23514' || error.code === 'P2034') {
                throw new InsufficientCreditsError();
            }
        }

        // For any database constraint violation in message, treat as insufficient credits
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('Usage_points_check') ||
            errorMessage.includes('check constraint') ||
            errorMessage.includes('violates check constraint')) {
            throw new InsufficientCreditsError();
        }

        // Re-throw other errors
        throw error;
    }
}

export async function getUsageStatus() {
    const { userId, has } = await auth();
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const now = new Date();
    const resetDate = new Date(now.getTime() + DURATION);

    try {
        // Get or create usage record
        let usage = await prisma.usage.findUnique({
            where: { key: userId },
        });

        // Check Clerk for real-time Pro status (in case webhook hasn't fired yet)
        const clerkHasPro = checkProPlanFromHas(has);

        // Determine plan: trust Clerk if it says Pro, otherwise use stored plan
        let plan = usage?.plan ?? UserPlan.FREE;

        // If Clerk says Pro but DB says Free, upgrade immediately
        if (clerkHasPro && plan === UserPlan.FREE) {
            plan = UserPlan.PRO;
            console.log(`User ${userId} detected as Pro via Clerk, upgrading...`);
        }

        const planCredits = getCreditsForPlan(plan);

        // If no record exists, create one with plan-appropriate credits
        if (!usage) {
            usage = await prisma.usage.create({
                data: {
                    key: userId,
                    points: planCredits,
                    expire: resetDate,
                    plan: plan,
                },
            });
        }

        // If user upgraded to Pro from Free, reset their credits to Pro level
        // ONLY reset if they were previously on FREE plan, NOT just because points < planCredits
        if (plan === UserPlan.PRO && usage.plan === UserPlan.FREE) {
            usage = await prisma.usage.update({
                where: { key: userId },
                data: {
                    plan: UserPlan.PRO,
                    points: planCredits,
                    expire: resetDate,
                },
            });
            console.log(`User ${userId} upgraded from FREE to PRO with ${planCredits} credits`);
        }

        // Check if expired and reset if needed
        if (usage.expire < now) {
            usage = await prisma.usage.update({
                where: { key: userId },
                data: {
                    points: planCredits,
                    expire: resetDate,
                    plan: plan,  // CRITICAL: Update plan on reset to stay in sync
                },
            });
            console.log(`User ${userId} credits expired and reset to ${planCredits} credits with plan ${plan}`);
        }

        // Calculate time until reset
        const msBeforeNext = usage.expire.getTime() - now.getTime();

        return {
            remainingPoints: usage.points,
            msBeforeNext: Math.max(0, msBeforeNext),
            consumedPoints: planCredits - usage.points,
            plan: plan === UserPlan.PRO ? "PRO" as const : "FREE" as const,
            totalCredits: planCredits,
        };
    } catch (error) {
        console.error("getUsageStatus error:", error);
        return {
            remainingPoints: FREE_POINTS,
            msBeforeNext: DURATION,
            consumedPoints: 0,
            plan: "FREE" as const,
            totalCredits: FREE_POINTS,
        };
    }
}

// Get subscription status
export async function getSubscriptionStatus() {
    const { userId, has } = await auth();
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const hasPro = checkProPlanFromHas(has);

    return {
        plan: hasPro ? "PRO" as const : "FREE" as const,
        isActive: true,
    };
}

// Manual upgrade function - call this to upgrade a user to Pro
export async function upgradeUserToPro(userId: string) {
    const usage = await ensureUserPlan(userId, UserPlan.PRO);
    console.log(`Manually upgraded user ${userId} to Pro with ${PRO_POINTS} credits`);
    return usage;
}

export async function downgradeUserToFree(userId: string) {
    const usage = await ensureUserPlan(userId, UserPlan.FREE);
    console.log(`Downgraded user ${userId} to Free with ${FREE_POINTS} credits`);
    return usage;
}

export async function setUserPlan(userId: string, plan: UserPlan) {
    if (!userId) {
        throw new Error("User ID required");
    }

    const now = new Date();
    const resetDate = new Date(now.getTime() + DURATION);
    const planCredits = getCreditsForPlan(plan);

    return prisma.usage.upsert({
        where: { key: userId },
        update: {
            plan,
            points: planCredits,
            expire: resetDate,
        },
        create: {
            key: userId,
            plan,
            points: planCredits,
            expire: resetDate,
        },
    });
}

export async function ensureUserPlan(userId: string, plan: UserPlan) {
    if (!userId) {
        throw new Error("User ID required");
    }

    const now = new Date();
    const resetDate = new Date(now.getTime() + DURATION);
    const planCredits = getCreditsForPlan(plan);

    const usage = await prisma.usage.findUnique({
        where: { key: userId },
    });

    if (!usage) {
        return prisma.usage.create({
            data: {
                key: userId,
                plan,
                points: planCredits,
                expire: resetDate,
            },
        });
    }

    if (usage.plan !== plan) {
        return prisma.usage.update({
            where: { key: userId },
            data: {
                plan,
                points: planCredits,
                expire: resetDate,
            },
        });
    }

    if (usage.expire < now) {
        return prisma.usage.update({
            where: { key: userId },
            data: {
                points: planCredits,
                expire: resetDate,
            },
        });
    }

    return usage;
}

// Refund credits if an operation fails after consumption
export async function refundCreditsForUser(userId: string, amount: number = GENERATION_COST) {
    try {
        const updatedUsage = await prisma.usage.update({
            where: { key: userId },
            data: {
                points: {
                    increment: amount,
                },
            },
        });

        console.log(`Refunded ${amount} credits to user ${userId}. New balance: ${updatedUsage.points}`);
        return updatedUsage;
    } catch (error) {
        console.error(`Failed to refund ${amount} credits to user ${userId}:`, error);
        throw error;
    }
}
