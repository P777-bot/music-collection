export {};

declare global {
  interface Window {
    __MUSIC_COLLECTION_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}
