-- Add roles and nullable song ownership without changing existing users or songs.
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

ALTER TABLE "Song"
ADD COLUMN "createdById" INTEGER;

INSERT INTO "Genre" ("name", "normalizedName", "parentId")
SELECT 'K-pop', 'k pop', "id" FROM "Genre" WHERE "normalizedName" = 'pop';

ALTER TABLE "Song"
ADD CONSTRAINT "Song_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Song_createdById_idx" ON "Song"("createdById");
