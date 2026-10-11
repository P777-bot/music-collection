-- Add authentication and per-user favorites without changing existing Song or Artist rows.
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Favorite" (
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "songId")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Favorite_songId_idx" ON "Favorite"("songId");

ALTER TABLE "Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite"
    ADD CONSTRAINT "Favorite_songId_fkey"
    FOREIGN KEY ("songId") REFERENCES "Song"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
