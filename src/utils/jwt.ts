import { Role } from '@/types/enums';

export interface AccessTokenPayload {
  sub: string;
  phone: string;
  role: Role;
  branchId: string | null;
  exp: number;
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AccessTokenPayload): boolean {
  return payload.exp * 1000 < Date.now();
}
