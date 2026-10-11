-- Add optional media metadata. Existing songs remain valid and unchanged.
ALTER TABLE "Song"
  ADD COLUMN "youtubeUrl" TEXT,
  ADD COLUMN "lyrics" TEXT;
