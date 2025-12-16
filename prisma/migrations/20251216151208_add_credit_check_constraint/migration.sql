-- Add check constraint to prevent negative credits
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_points_check" CHECK ("points" >= 0);