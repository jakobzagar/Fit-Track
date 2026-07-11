-- AlterColumn
ALTER TABLE "WorkoutSet"
ALTER COLUMN "weight" TYPE DECIMAL(8, 2)
USING ROUND("weight"::numeric, 2);

-- AddCheckConstraints
ALTER TABLE "WorkoutExercise"
ADD CONSTRAINT "WorkoutExercise_position_positive_check"
CHECK ("position" > 0);

ALTER TABLE "WorkoutSet"
ADD CONSTRAINT "WorkoutSet_setNumber_positive_check"
CHECK ("setNumber" > 0),
ADD CONSTRAINT "WorkoutSet_reps_positive_check"
CHECK ("reps" IS NULL OR "reps" > 0),
ADD CONSTRAINT "WorkoutSet_weight_range_check"
CHECK ("weight" IS NULL OR ("weight" >= 0 AND "weight" <= 999999.99)),
ADD CONSTRAINT "WorkoutSet_durationSeconds_positive_check"
CHECK ("durationSeconds" IS NULL OR "durationSeconds" > 0),
ADD CONSTRAINT "WorkoutSet_reps_or_duration_check"
CHECK ("reps" IS NOT NULL OR "durationSeconds" IS NOT NULL);

-- ReplaceIndex
DROP INDEX "Workout_userId_idx";
CREATE INDEX "Workout_userId_performedAt_idx"
ON "Workout"("userId", "performedAt" DESC);
