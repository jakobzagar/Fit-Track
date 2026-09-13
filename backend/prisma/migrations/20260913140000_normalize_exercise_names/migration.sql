BEGIN;

ALTER TABLE "Exercise"
ADD COLUMN "normalizedName" TEXT;

UPDATE "Exercise"
SET "normalizedName" = LOWER(BTRIM("name"));

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Exercise"
        GROUP BY "userId", "normalizedName"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce case-insensitive exercise names while a user has conflicting names';
    END IF;
END $$;

ALTER TABLE "Exercise"
ALTER COLUMN "normalizedName" SET NOT NULL;

DROP INDEX "Exercise_userId_name_key";

CREATE UNIQUE INDEX "Exercise_userId_normalizedName_key"
ON "Exercise"("userId", "normalizedName");

COMMIT;
