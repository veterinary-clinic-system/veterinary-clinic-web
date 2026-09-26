import { describe, expect, it } from 'vitest';
import { resolveOwnedPetId } from './handoff';

describe('resolveOwnedPetId', () => {
  it('keeps a pet belonging to the signed-in owner', () => {
    expect(resolveOwnedPetId('pet-2', ['pet-1', 'pet-2'])).toBe('pet-2');
  });

  it('rejects forged or stale route state', () => {
    expect(resolveOwnedPetId('another-owner-pet', ['pet-1'])).toBe('');
    expect(resolveOwnedPetId(undefined, ['pet-1'])).toBe('');
  });
});
