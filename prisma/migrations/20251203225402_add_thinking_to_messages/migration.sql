-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'THINKING';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "thinking" JSONB;
