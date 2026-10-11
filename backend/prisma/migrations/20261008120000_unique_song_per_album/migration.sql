-- Reconstructed from the already-applied database index and its migration name.
-- The live index is Song_artistId_album_name_key on (artistId, album, name).
CREATE UNIQUE INDEX "Song_artistId_album_name_key" ON "Song"("artistId", "album", "name");
