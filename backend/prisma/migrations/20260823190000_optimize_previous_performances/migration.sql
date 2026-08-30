CREATE INDEX "Workout_userId_status_completedAt_idx"
ON "Workout"("userId", "status", "completedAt" DESC);
