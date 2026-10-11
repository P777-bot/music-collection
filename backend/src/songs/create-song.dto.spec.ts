import { BadRequestException } from '@nestjs/common';
import { CreateSongDto, SongValidationPipe } from './create-song.dto';

describe('SongValidationPipe', () => {
  const pipe = new SongValidationPipe();
  const validSong: CreateSongDto = {
    name: '  Song  ',
    artist: '  Artist  ',
    album: 'Album',
    genre: 'Pop',
    releaseDate: '2020-01-02',
    coverUrl: null,
  };

  it('trims required text and accepts an optional empty cover URL', () => {
    expect(pipe.transform(validSong)).toMatchObject({
      name: 'Song',
      artist: 'Artist',
      coverUrl: null,
    });
  });

  it('rejects a missing title, invalid date, future date, or non-HTTP URL', () => {
    expect(() => pipe.transform({ ...validSong, name: '  ' })).toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validSong, releaseDate: '2024-02-30' })).toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validSong, releaseDate: '2999-01-01' })).toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validSong, coverUrl: 'javascript:alert(1)' })).toThrow(BadRequestException);
  });

  it('accepts a selected Genre list and rejects duplicate spellings', () => {
    expect(pipe.transform({ ...validSong, genres: ['Hip hop', 'Electronic / Dance'] }).genres)
      .toEqual(['Hip hop', 'Electronic / Dance']);
    expect(() => pipe.transform({ ...validSong, genres: ['Hip hop', 'Hip-Hop'] }))
      .toThrow(BadRequestException);
    expect(() => pipe.transform({ ...validSong, genres: [] }))
      .toThrow(BadRequestException);
  });

  it('accepts supported YouTube URL formats and optional lyrics', () => {
    for (const youtubeUrl of [
      'https://www.youtube.com/watch?v=abcdefghijk',
      'https://youtu.be/abcdefghijk',
      'https://www.youtube.com/shorts/abcdefghijk',
    ]) {
      expect(pipe.transform({ ...validSong, youtubeUrl, lyrics: 'First line\nSecond line' }))
        .toMatchObject({ youtubeUrl, lyrics: 'First line\nSecond line' });
    }
    expect(pipe.transform({ ...validSong, youtubeUrl: '', lyrics: '' }))
      .toMatchObject({ youtubeUrl: null, lyrics: null });
  });

  it('rejects unsupported YouTube hostnames, protocols, and malformed IDs', () => {
    for (const youtubeUrl of [
      'https://youtube.com.example.org/watch?v=abcdefghijk',
      'http://www.youtube.com/watch?v=abcdefghijk',
      'https://www.youtube.com/watch?v=short',
      'https://youtu.be/abcdefghijk/extra',
    ]) {
      expect(() => pipe.transform({ ...validSong, youtubeUrl })).toThrow(BadRequestException);
    }
  });

  it('rejects lyrics beyond the configured storage limit', () => {
    expect(() => pipe.transform({ ...validSong, lyrics: 'x'.repeat(50001) })).toThrow(BadRequestException);
  });
});
