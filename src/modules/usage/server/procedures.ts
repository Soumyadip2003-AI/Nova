import { getUsageStatus, getSubscriptionStatus } from "@/lib/usage";
import { createTRPCRouter,protectedProcedure } from "@/trpc/init";

export const usageRouter = createTRPCRouter({
    status: protectedProcedure.query(async()=>{
        try{
            const result = await getUsageStatus();
            return result;
        }catch{
            return null;
        }
    }),
    subscription: protectedProcedure.query(async()=>{
        try{
            const result = await getSubscriptionStatus();
            return result;
        }catch{
            return null;
        }
    }),
});