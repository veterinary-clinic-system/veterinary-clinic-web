import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/auth.api';
import { tokenStore } from '@/api/token-store';
import { AccessTokenPayload, decodeAccessToken, isTokenExpired } from '@/utils/jwt';

interface AuthContextValue {
  user: AccessTokenPayload | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  registerPetOwner: (payload: {
    phone: string;
    password: string;
    fullName: string;
    email?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccessTokenPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const tokens = await authApi.refresh(refreshToken);
        applyTokens(tokens.accessToken, tokens.refreshToken);
      } catch {
        tokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, []);

  function applyTokens(accessToken: string, refreshToken: string) {
    tokenStore.setAccessToken(accessToken);
    tokenStore.setRefreshToken(refreshToken);
    const payload = decodeAccessToken(accessToken);
    setUser(payload && !isTokenExpired(payload) ? payload : null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (phone, password) => {
        const tokens = await authApi.login(phone, password);
        applyTokens(tokens.accessToken, tokens.refreshToken);
      },
      registerPetOwner: async (payload) => {
        const tokens = await authApi.registerPetOwner(payload);
        applyTokens(tokens.accessToken, tokens.refreshToken);
      },
      logout: async () => {
        const refreshToken = tokenStore.getRefreshToken();
        tokenStore.clear();
        setUser(null);
        if (refreshToken) {
          await authApi.logout(refreshToken).catch(() => undefined);
        }
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
