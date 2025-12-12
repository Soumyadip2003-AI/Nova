/*
  Warnings:

  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'CHAT';

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Message_projectId_updatedAt_idx" ON "Message"("projectId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_projectId_type_idx" ON "Message"("projectId", "type");
