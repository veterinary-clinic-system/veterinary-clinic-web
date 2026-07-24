const REFRESH_TOKEN_KEY = 'vetclinic.refreshToken';

/**
 * The access token only ever lives in memory (cleared on full page reload) to limit
 * XSS blast radius; the refresh token is persisted to localStorage so a reload doesn't
 * force a re-login. A production deployment would prefer an httpOnly cookie for the
 * refresh token instead - documented as a known simplification in the root CLAUDE.md.
 */
let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
  clear: () => {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
