export function resolveOwnedPetId(
  candidatePetId: string | undefined,
  ownedPetIds: readonly string[],
): string {
  if (!candidatePetId) return '';
  return ownedPetIds.includes(candidatePetId) ? candidatePetId : '';
}
