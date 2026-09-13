ALTER TABLE "WorkoutExercise"
ADD COLUMN "exerciseName" TEXT,
ADD COLUMN "exerciseMuscleGroup" TEXT,
ADD COLUMN "exerciseEquipment" TEXT;

UPDATE "WorkoutExercise" AS workout_exercise
SET
    "exerciseName" = exercise."name",
    "exerciseMuscleGroup" = exercise."muscleGroup",
    "exerciseEquipment" = exercise."equipment"
FROM "Exercise" AS exercise
WHERE workout_exercise."exerciseId" = exercise."id";

ALTER TABLE "WorkoutExercise"
ALTER COLUMN "exerciseName" SET NOT NULL,
ALTER COLUMN "exerciseMuscleGroup" SET NOT NULL;
