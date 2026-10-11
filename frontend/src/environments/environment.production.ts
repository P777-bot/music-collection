const configuredApiBaseUrl = typeof window !== 'undefined'
  ? window.__MUSIC_COLLECTION_CONFIG__?.apiBaseUrl
  : undefined;

export const environment = {
  production: true,
  // The Render build script injects API_BASE_URL into runtime-config.js.
  // Keep the local fallback so a production build can still be previewed locally.
  apiBaseUrl: configuredApiBaseUrl?.replace(/\/+$/, '') || 'http://localhost:3000',
};
