const configuredApiBaseUrl = typeof window !== 'undefined'
  ? window.__MUSIC_COLLECTION_CONFIG__?.apiBaseUrl
  : undefined;

export const environment = {
  production: true,
  // Production builds receive API_BASE_URL through runtime-config.js.
  // If that config is absent, stay on this HTTPS site origin rather than
  // silently sending public users' requests to localhost.
  apiBaseUrl: configuredApiBaseUrl?.replace(/\/+$/, '') ||
    (typeof window === 'undefined' ? '' : window.location.origin),
};
