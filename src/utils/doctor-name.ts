/**
 * "BS. Lê Văn An" - thêm chức danh đúng một lần. Tên bác sĩ trong CSDL có khi đã lưu sẵn tiền
 * tố ("BS. Lê Văn An", "Bác sĩ An", "ThS.BS ..."), nối thêm "BS. " thành "BS. BS. Lê Văn An".
 */
export function formatDoctorName(name: string | null | undefined, fallback = '—'): string {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  if (/^(?:bs|bác sĩ|bac si|ths|ts|pgs|gs|dr)\b\.?/iu.test(trimmed) || /\bBS\b\.?/u.test(trimmed.split(' ')[0])) {
    return trimmed;
  }
  return `BS. ${trimmed}`;
}
