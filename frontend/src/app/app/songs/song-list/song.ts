export interface Song {
  id: number;
  name: string;
  artist: string;
  album: string;
  genre: string;
  releaseDate: string;
  coverUrl?: string | null;
}