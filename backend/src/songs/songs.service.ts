import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateSongDto } from './create-song.dto';
import type { PublicUser } from '../auth/auth.types';

const songWithRelations = Prisma.validator<Prisma.SongDefaultArgs>()({
  include: {
    artist: true,
    genres: { include: { genre: { include: { parent: true } } } },
  },
});
type SongWithRelations = Prisma.SongGetPayload<typeof songWithRelations>;

@Injectable()
export class SongsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const songs = await this.prisma.song.findMany({
      ...songWithRelations,
      orderBy: {
        id: 'asc',
      },
    });
    return songs.map(song => this.serialize(song));
  }

  async findOne(id: number) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      ...songWithRelations,
    });
    if (!song) throw new NotFoundException(`Song ${id} was not found.`);
    return this.serialize(song);
  }

  async create(data: CreateSongDto, actor: PublicUser) {
    if (!data.genres?.length) throw new BadRequestException('Select at least one genre.');
    const genreRows = await this.resolveGenres(data.genres);
    try {
      const song = await this.prisma.song.create({
        data: {
          createdBy: { connect: { id: actor.id } },
          name: data.name,
          album: data.album,
          genre: genreRows[0].name,
          releaseDate: new Date(`${data.releaseDate}T00:00:00.000Z`),
          coverUrl: data.coverUrl || null,
          youtubeUrl: data.youtubeUrl || null,
          lyrics: data.lyrics || null,
          artist: {
            connectOrCreate: {
              where: { name: data.artist },
              create: { name: data.artist },
            },
          },
          genres: { create: genreRows.map(({ id: genreId }) => ({ genre: { connect: { id: genreId } } })) },
        },
        ...songWithRelations,
      });
      return this.serialize(song);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('This song already exists in the selected artist and album.');
      }
      throw error;
    }
  }

  async update(id: number, data: CreateSongDto, actor: PublicUser) {
    await this.assertCanManage(id, actor);
    const genreRows = data.genres ? await this.resolveGenres(data.genres) : undefined;
    try {
      return await this.prisma.$transaction(async transaction => {
        await transaction.song.update({
          where: { id },
          data: {
            name: data.name,
            album: data.album,
            genre: genreRows?.[0].name ?? data.genre,
            releaseDate: new Date(`${data.releaseDate}T00:00:00.000Z`),
            coverUrl: data.coverUrl || null,
            youtubeUrl: data.youtubeUrl || null,
            lyrics: data.lyrics || null,
            artist: {
              connectOrCreate: {
                where: { name: data.artist },
                create: { name: data.artist },
              },
            },
          },
        });
        if (genreRows) {
          await transaction.songGenre.deleteMany({ where: { songId: id } });
          await transaction.songGenre.createMany({
            data: genreRows.map(({ id: genreId }) => ({ songId: id, genreId })),
          });
        }
        const updated = await transaction.song.findUnique({ where: { id }, ...songWithRelations });
        if (!updated) throw new NotFoundException(`Song ${id} was not found.`);
        return this.serialize(updated);
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('This song already exists in the selected artist and album.');
      }
      throw error;
    }
  }

  async remove(id: number, actor: PublicUser) {
    await this.assertCanManage(id, actor);
    await this.prisma.song.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async assertCanManage(id: number, actor: PublicUser): Promise<void> {
    const song = await this.prisma.song.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!song) throw new NotFoundException(`Song ${id} was not found.`);
    if (actor.role !== 'ADMIN' && song.createdById !== actor.id) {
      throw new ForbiddenException('You cannot manage this song.');
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error &&
      (error as { code?: unknown }).code === 'P2002';
  }

  private async resolveGenres(names: string[]): Promise<Array<{ id: number; name: string }>> {
    const genres: Array<{ id: number; name: string }> = [];
    for (const name of names) {
      const key = this.normalizeGenreKey(name);
      const alias = await this.prisma.genreAlias.findUnique({ where: { aliasKey: key } });
      const genre = alias
        ? null
        : await this.prisma.genre.findUnique({ where: { normalizedName: key } });
      const id = alias?.genreId ?? genre?.id;
      if (!id) throw new BadRequestException(`Unknown genre: ${name}`);
      if (genres.some(item => item.id === id)) throw new BadRequestException('Selected genres resolve to a duplicate category.');
      const canonical = alias
        ? await this.prisma.genre.findUnique({ where: { id }, select: { id: true, name: true } })
        : genre;
      if (!canonical) throw new BadRequestException(`Unknown genre: ${name}`);
      genres.push(canonical);
    }
    return genres;
  }

  private normalizeGenreKey(value: string): string {
    return value.normalize('NFKC').toLocaleLowerCase('en')
      .replace(/['’]/g, '')
      .replace(/[–—-]/g, ' ')
      .replace(/\s*&\s*/g, ' and ')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim().replace(/\s+/g, ' ');
  }

  private serialize(song: SongWithRelations) {
    return {
      ...song,
      genres: song.genres.map(({ genre }) => ({
        id: genre.id,
        name: genre.name,
        parentId: genre.parentId,
      })),
    };
  }
}
