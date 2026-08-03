import { Role } from '@/types/enums';

export interface AccessTokenPayload {
  sub: string;
  phone: string;
  role: Role;
  branchId: string | null;
  exp: number;
}

/**
 * Client-side JWT decode with NO signature verification - only used to read role/phone
 * for UI routing/display. The real access-control boundary is the backend's
 * JwtAuthGuard/RolesGuard (prompt.md Section 7.2: "frontend guards are UX, never the
 * security boundary").
 */
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
