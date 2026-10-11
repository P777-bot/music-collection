import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { song: { include: { artist: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map(({ song, createdAt }) => ({ songId: song.id, createdAt, song }));
  }

  async add(userId: number, songId: number) {
    const songExists = await this.prisma.song.findUnique({
      where: { id: songId },
      select: { id: true },
    });
    if (!songExists) throw new NotFoundException(`Song ${songId} was not found.`);

    const favorite = await this.prisma.favorite.upsert({
      where: { userId_songId: { userId, songId } },
      create: { userId, songId },
      update: {},
      include: { song: { include: { artist: true } } },
    });
    return { songId: favorite.song.id, createdAt: favorite.createdAt, song: favorite.song };
  }

  async remove(userId: number, songId: number) {
    await this.prisma.favorite.deleteMany({ where: { userId, songId } });
    return { songId, favorited: false };
  }
}
