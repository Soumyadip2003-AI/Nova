-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "Usage" ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'FREE';
