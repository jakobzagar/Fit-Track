-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Workout"
ADD COLUMN "status" "WorkoutStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkoutSet"
ADD COLUMN "completedAt" TIMESTAMP(3);
