// Token storage utilities
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

export const setAccessToken = (token) => {
  localStorage.setItem('accessToken', token);
};

export const removeAccessToken = () => {
  localStorage.removeItem('accessToken');
};

/** Backend origin for building full image URLs (e.g. for event images). */
export const getApiOrigin = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return new URL(import.meta.env.VITE_API_BASE_URL).origin;
  }
  return import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;
};
