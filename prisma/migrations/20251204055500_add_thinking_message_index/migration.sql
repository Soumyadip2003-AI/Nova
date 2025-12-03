-- CreateIndex
-- Add index for THINKING message queries to improve performance
CREATE INDEX "Message_type_idx" ON "Message"("type") WHERE "type" = 'THINKING';
