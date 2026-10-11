import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const artists = await this.prisma.artist.findMany({
      where: { songs: { some: {} } },
      orderBy: { name: 'asc' },
      include: {
        songs: { select: { album: true } },
        _count: { select: { songs: true } },
      },
    });

    return artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      songCount: artist._count.songs,
      albumCount: this.countAlbums(artist.songs.map(song => song.album)),
    }));
  }

  async findOne(id: number) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: [{ album: 'asc' }, { name: 'asc' }, { id: 'asc' }],
          include: { genres: { include: { genre: true } } },
        },
      },
    });
    if (!artist || artist.songs.length === 0) {
      throw new NotFoundException(`Artist ${id} was not found.`);
    }

    const songs = artist.songs.map(song => ({
      id: song.id,
      artistId: artist.id,
      name: song.name,
      album: song.album,
      genre: song.genre,
      releaseDate: song.releaseDate,
      coverUrl: song.coverUrl,
      youtubeUrl: song.youtubeUrl,
      lyrics: song.lyrics,
      genres: song.genres.map(({ genre }) => ({
        id: genre.id,
        name: genre.name,
        parentId: genre.parentId,
      })),
      artist: { id: artist.id, name: artist.name },
    }));

    const albumMap = new Map<string, typeof songs>();
    const unalbumedSongs: typeof songs = [];
    for (const song of songs) {
      const name = song.album.trim();
      if (!name) {
        unalbumedSongs.push(song);
        continue;
      }
      const group = albumMap.get(song.album) ?? [];
      group.push(song);
      albumMap.set(song.album, group);
    }

    const albums = [...albumMap.entries()]
      .map(([name, albumSongs]) => ({
        name,
        songCount: albumSongs.length,
        coverUrl: albumSongs.find(song => song.coverUrl)?.coverUrl ?? null,
        songs: albumSongs,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: artist.id,
      name: artist.name,
      songCount: songs.length,
      albumCount: albums.length,
      albums,
      unalbumedSongs,
      songs,
    };
  }

  private countAlbums(albumNames: string[]): number {
    return new Set(albumNames.filter(name => !!name.trim())).size;
  }
}
