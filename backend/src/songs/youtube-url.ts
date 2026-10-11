const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Return a video ID only for the supported, HTTPS YouTube URL forms. */
export function extractYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;

    let id: string | null = null;
    if (url.hostname === 'youtu.be') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length === 1) id = parts[0];
    } else if (YOUTUBE_HOSTS.has(url.hostname)) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (parts.length === 2 && parts[0] === 'shorts') id = parts[1];
    }

    return id && VIDEO_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}
