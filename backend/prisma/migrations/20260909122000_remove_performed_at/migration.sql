DROP INDEX "Workout_userId_performedAt_idx";

ALTER TABLE "Workout"
DROP COLUMN "performedAt";
