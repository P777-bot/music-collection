import { extractYouTubeVideoId } from './youtube-url';

describe('extractYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
    ['https://youtu.be/abcdefghijk', 'abcdefghijk'],
    ['https://youtube.com/shorts/abcdefghijk', 'abcdefghijk'],
  ])('extracts only supported video IDs from %s', (url, id) => {
    expect(extractYouTubeVideoId(url)).toBe(id);
  });

  it.each([
    'https://youtube.com.evil.invalid/watch?v=abcdefghijk',
    'http://youtube.com/watch?v=abcdefghijk',
    'https://youtube.com/watch?v=bad',
    'https://youtube.com@evil.invalid/watch?v=abcdefghijk',
    'javascript:alert(1)',
  ])('rejects untrusted URLs %s', url => {
    expect(extractYouTubeVideoId(url)).toBeNull();
  });
});
