/**
 * Application version detection.
 * VITE_APP_VERSION is set at build time. Falls back to a timestamp-based version.
 */
export const APP_VERSION: string =
  import.meta.env.VITE_APP_VERSION ||
  `auto-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
