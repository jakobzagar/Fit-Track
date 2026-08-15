ALTER TABLE "Workout"
ADD CONSTRAINT "Workout_lifecycle_timestamps_check"
CHECK (
    ("status" = 'DRAFT' AND "startedAt" IS NULL AND "completedAt" IS NULL)
    OR ("status" = 'ACTIVE' AND "startedAt" IS NOT NULL AND "completedAt" IS NULL)
    OR (
        "status" = 'COMPLETED'
        AND "startedAt" IS NOT NULL
        AND "completedAt" IS NOT NULL
        AND "completedAt" >= "startedAt"
    )
);
