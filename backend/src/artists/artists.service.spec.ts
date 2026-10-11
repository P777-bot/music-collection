import { NotFoundException } from '@nestjs/common';
import { ArtistsService } from './artists.service';

describe('ArtistsService', () => {
  const prisma = {
    artist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const service = new ArtistsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns artist summaries with song and distinct non-empty album counts', async () => {
    prisma.artist.findMany.mockResolvedValue([{
      id: 9,
      name: 'Artist',
      songs: [{ album: 'Album A' }, { album: 'Album A' }, { album: '' }, { album: 'Album B' }],
      _count: { songs: 4 },
    }]);

    await expect(service.findAll()).resolves.toEqual([
      { id: 9, name: 'Artist', songCount: 4, albumCount: 2 },
    ]);
    expect(prisma.artist.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { songs: { some: {} } },
    }));
  });

  it('groups songs by album, retains unalbumed songs, and reports counts', async () => {
    const makeSong = (id: number, album: string) => ({
      id, name: `Song ${id}`, album, genre: 'Pop', releaseDate: new Date('2020-01-01'),
      coverUrl: null, youtubeUrl: null, lyrics: null, genres: [],
    });
    prisma.artist.findUnique.mockResolvedValue({
      id: 9,
      name: 'Artist',
      songs: [makeSong(1, 'Album A'), makeSong(2, 'Album A'), makeSong(3, '   ')],
    });

    const detail = await service.findOne(9);
    expect(detail.albumCount).toBe(1);
    expect(detail.songCount).toBe(3);
    expect(detail.albums[0].songCount).toBe(2);
    expect(detail.unalbumedSongs.map(song => song.id)).toEqual([3]);
    expect(detail.songs).toHaveLength(3);
  });

  it('returns 404 when artist does not exist or has no songs', async () => {
    prisma.artist.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
    prisma.artist.findUnique.mockResolvedValue({ id: 4, name: 'Empty', songs: [] });
    await expect(service.findOne(4)).rejects.toBeInstanceOf(NotFoundException);
  });
});
