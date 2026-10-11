/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `Song` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Song` table. All the data in the column will be lost.
  - You are about to drop the column `releaseYear` on the `Song` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Song` table. All the data in the column will be lost.
  - Added the required column `name` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `releaseDate` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Made the column `album` on table `Song` required. This step will fail if there are existing NULL values in that column.
  - Made the column `genre` on table `Song` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Song" DROP COLUMN "coverUrl",
DROP COLUMN "createdAt",
DROP COLUMN "releaseYear",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "releaseDate" DATE NOT NULL,
ALTER COLUMN "album" SET NOT NULL,
ALTER COLUMN "genre" SET NOT NULL;
