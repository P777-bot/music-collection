import { BadRequestException, PipeTransform } from '@nestjs/common';
import { extractYouTubeVideoId } from './youtube-url';

export class CreateSongDto {
  name!: string;
  artist!: string;
  album!: string;
  genre!: string;
  genres?: string[];
  releaseDate!: string;
  coverUrl?: string | null;
  youtubeUrl?: string | null;
  lyrics?: string | null;
}

/** Validates the API payload without adding a runtime validation dependency. */
export class SongValidationPipe implements PipeTransform<unknown, CreateSongDto> {
  transform(value: unknown): CreateSongDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Request body must be an object.');
    }

    const body = value as Record<string, unknown>;
    const fields: Array<[keyof CreateSongDto, number]> = [
      ['name', 200],
      ['artist', 150],
      ['album', 200],
      ['genre', 100],
    ];

    for (const [field, maxLength] of fields) {
      const fieldValue = body[field];
      if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
        throw new BadRequestException(`${field} is required.`);
      }
      if (fieldValue.trim().length > maxLength) {
        throw new BadRequestException(`${field} must be at most ${maxLength} characters.`);
      }
    }

    if (typeof body.releaseDate !== 'string' || !this.isValidDate(body.releaseDate)) {
      throw new BadRequestException('releaseDate must be a valid YYYY-MM-DD date.');
    }
    if (body.releaseDate > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('releaseDate cannot be in the future.');
    }

    const coverUrl = body.coverUrl;
    if (coverUrl !== undefined && coverUrl !== null && coverUrl !== '') {
      if (typeof coverUrl !== 'string' || coverUrl.length > 2048 || !this.isHttpUrl(coverUrl)) {
        throw new BadRequestException('coverUrl must be a valid HTTP or HTTPS URL.');
      }
    }

    const youtubeUrl = body.youtubeUrl;
    if (youtubeUrl !== undefined && youtubeUrl !== null && youtubeUrl !== '') {
      if (typeof youtubeUrl !== 'string' || youtubeUrl.length > 2048 ||
          !extractYouTubeVideoId(youtubeUrl.trim())) {
        throw new BadRequestException('youtubeUrl must be a supported HTTPS YouTube video URL.');
      }
    }

    const lyrics = body.lyrics;
    if (lyrics !== undefined && lyrics !== null && lyrics !== '' &&
        (typeof lyrics !== 'string' || lyrics.length > 50000)) {
      throw new BadRequestException('lyrics must be text no longer than 50000 characters.');
    }

    if (body.genres !== undefined) {
      if (!Array.isArray(body.genres) || body.genres.length === 0 || body.genres.length > 8 ||
          body.genres.some(value => typeof value !== 'string' || !value.trim() || value.length > 80)) {
        throw new BadRequestException('genres must contain between 1 and 8 valid genre names.');
      }
      const normalizedGenres = body.genres.map(value => this.normalizeGenre(value as string));
      if (new Set(normalizedGenres).size !== normalizedGenres.length) {
        throw new BadRequestException('genres must not contain duplicate values.');
      }
    }

    return {
      name: (body.name as string).trim(),
      artist: (body.artist as string).trim(),
      album: (body.album as string).trim(),
      genre: (body.genre as string).trim(),
      genres: body.genres as string[] | undefined,
      releaseDate: body.releaseDate,
      coverUrl: typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null,
      youtubeUrl: typeof youtubeUrl === 'string' && youtubeUrl.trim() ? youtubeUrl.trim() : null,
      lyrics: typeof lyrics === 'string' && lyrics.trim() ? lyrics : null,
    };
  }

  private normalizeGenre(value: string): string {
    return value.normalize('NFKC').toLocaleLowerCase('en')
      .replace(/['’]/g, '')
      .replace(/[–—-]/g, ' ')
      .replace(/\s*&\s*/g, ' and ')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim().replace(/\s+/g, ' ');
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname && !/\s/.test(value);
    } catch {
      return false;
    }
  }
}
