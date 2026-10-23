export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/** Demo mode: MatchPage uses built-in fictional data and makes no API requests. Set VITE_DEMO_MODE=false to use real APIs. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
} as const;
