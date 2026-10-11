-- Add a normalized Genre catalog and Song many-to-many links. Keep Song.genre
-- intact as the legacy/source value so no existing genre text is discarded.
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "parentId" INTEGER,
    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Genre_parentId_fkey" FOREIGN KEY ("parentId")
      REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "GenreAlias" (
    "aliasKey" TEXT NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "GenreAlias_pkey" PRIMARY KEY ("aliasKey"),
    CONSTRAINT "GenreAlias_genreId_fkey" FOREIGN KEY ("genreId")
      REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SongGenre" (
    "songId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    CONSTRAINT "SongGenre_pkey" PRIMARY KEY ("songId", "genreId"),
    CONSTRAINT "SongGenre_songId_fkey" FOREIGN KEY ("songId")
      REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SongGenre_genreId_fkey" FOREIGN KEY ("genreId")
      REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE UNIQUE INDEX "Genre_normalizedName_key" ON "Genre"("normalizedName");
CREATE INDEX "GenreAlias_genreId_idx" ON "GenreAlias"("genreId");
CREATE INDEX "SongGenre_genreId_idx" ON "SongGenre"("genreId");

INSERT INTO "Genre" ("name", "normalizedName") VALUES
  ('Pop', 'pop'),
  ('Rock', 'rock'),
  ('Alternative / Indie', 'alternative indie'),
  ('Hip-Hop / Rap', 'hip hop rap'),
  ('R&B / Soul', 'r and b soul'),
  ('Electronic / Dance', 'electronic dance'),
  ('Jazz', 'jazz'),
  ('Blues', 'blues'),
  ('Classical', 'classical'),
  ('Country', 'country'),
  ('Folk / Traditional', 'folk traditional'),
  ('Reggae / Ska', 'reggae ska'),
  ('Metal', 'metal'),
  ('Punk', 'punk'),
  ('Latin', 'latin'),
  ('Gospel / Religious', 'gospel religious'),
  ('Soundtrack / Score', 'soundtrack score'),
  ('World Music', 'world music'),
  ('Experimental / Avant-Garde', 'experimental avant garde'),
  ('Children''s Music', 'childrens music'),
  ('Other / Unclassified', 'other unclassified');

-- These known subgenres already appear in the collection. Parent links make
-- their relationship explicit without rewriting the original Song.genre.
INSERT INTO "Genre" ("name", "normalizedName", "parentId")
SELECT 'Indie Pop', 'indie pop', "id" FROM "Genre" WHERE "normalizedName" = 'alternative indie';
INSERT INTO "Genre" ("name", "normalizedName", "parentId")
SELECT 'T-pop', 't pop', "id" FROM "Genre" WHERE "normalizedName" = 'pop';

INSERT INTO "GenreAlias" ("aliasKey", "genreId")
SELECT aliases.alias_key, genres."id"
FROM (VALUES
  ('hip hop', 'hip hop rap'),
  ('rap', 'hip hop rap'),
  ('r and b', 'r and b soul'),
  ('rhythm and blues', 'r and b soul'),
  ('edm', 'electronic dance'),
  ('electronic dance music', 'electronic dance'),
  ('folk', 'folk traditional'),
  ('traditional folk', 'folk traditional'),
  ('ska', 'reggae ska'),
  ('score', 'soundtrack score'),
  ('soundtracks', 'soundtrack score'),
  ('avant garde', 'experimental avant garde'),
  ('children music', 'childrens music'),
  ('childrens music', 'childrens music')
) AS aliases(alias_key, normalized_name)
JOIN "Genre" genres ON genres."normalizedName" = aliases.normalized_name;

-- Conservative backfill: only exact case-insensitive catalog names and the
-- explicitly listed aliases are linked. Unrecognized/ambiguous legacy values
-- remain unchanged in Song.genre and intentionally have no SongGenre row.
INSERT INTO "SongGenre" ("songId", "genreId")
SELECT songs."id", COALESCE(alias."genreId", exact_genre."id")
FROM "Song" songs
LEFT JOIN "GenreAlias" alias ON alias."aliasKey" = lower(trim(songs."genre"))
LEFT JOIN "Genre" exact_genre ON lower(trim(exact_genre."name")) = lower(trim(songs."genre"))
WHERE alias."genreId" IS NOT NULL OR exact_genre."id" IS NOT NULL
ON CONFLICT ("songId", "genreId") DO NOTHING;
