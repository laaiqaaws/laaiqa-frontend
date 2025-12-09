export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const FEATURES = {
  enableAnalytics: IS_PRODUCTION,
  enableErrorReporting: IS_PRODUCTION,
  showDebugInfo: IS_DEVELOPMENT,
};

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN_LOGIN: '/admin-login',
  CALLBACK: '/callback',
  ADMIN: '/admin',
  ARTIST: '/artist',
  CUSTOMER: '/customer',
  PROFILE_ARTIST: '/profile/artist',
  PROFILE_CUSTOMER: '/profile/customer',
  HOME: '/',
  QUOTE: '/quote',
};

export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin': return ROUTES.ADMIN;
    case 'artist': return ROUTES.ARTIST;
    case 'customer': return ROUTES.CUSTOMER;
    default: return ROUTES.SIGNUP;
  }
}

export function getProfileRoute(role: string): string {
  switch (role) {
    case 'artist': return ROUTES.PROFILE_ARTIST;
    case 'customer': return ROUTES.PROFILE_CUSTOMER;
    default: return ROUTES.SIGNUP;
  }
}

export const API_ENDPOINTS = {
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_ROLE: `${API_BASE_URL}/auth/role`,
  AUTH_CSRF: `${API_BASE_URL}/auth/csrf-token`,
  AUTH_PROFILE_STATUS: `${API_BASE_URL}/auth/profile-status`,
  QUOTES_ARTIST: `${API_BASE_URL}/api/quotes/artist`,
  QUOTES_CUSTOMER: `${API_BASE_URL}/api/quotes/customer`,
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_QUOTES: `${API_BASE_URL}/api/admin/quotes`,
  ADMIN_REVIEWS: `${API_BASE_URL}/api/admin/reviews`,
  ADMIN_DISPUTES: `${API_BASE_URL}/api/admin/disputes`,
};

export const VALIDATION = {
  PHONE: { MIN_LENGTH: 10, MAX_LENGTH: 15 },
  PIN_CODE: { LENGTH: 6 },
  NAME: { MIN_LENGTH: 2, MAX_LENGTH: 100 },
  BIO: { MIN_LENGTH: 10, MAX_LENGTH: 2000 },
  AGE: { MIN: 18, MAX: 120 },
  HEIGHT: { MIN: 50, MAX: 300 },
  WEIGHT: { MIN: 20, MAX: 500 },
};

export const UI = {
  BACKGROUND_IMAGES: ['/bg1.jpg', '/bg2.jpg', '/bg3.jpg'],
  BACKGROUND_INTERVAL: 8000,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
};

export default {
  NODE_ENV, IS_PRODUCTION, IS_DEVELOPMENT, API_BASE_URL, APP_URL,
  FEATURES, ROUTES, API_ENDPOINTS, VALIDATION, UI, getDashboardRoute, getProfileRoute,
};
