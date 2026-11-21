import { describe, expect, it } from 'vitest';
import { formatDoctorName } from './doctor-name';

describe('formatDoctorName', () => {
  it('không lặp chức danh khi tên đã có "BS."', () => {
    expect(formatDoctorName('BS. Lê Văn An')).toBe('BS. Lê Văn An');
    expect(formatDoctorName('ThS.BS Trần Hoa')).toBe('ThS.BS Trần Hoa');
  });

  it('thêm chức danh cho tên trần, fallback khi trống', () => {
    expect(formatDoctorName('Phạm Thị Bích')).toBe('BS. Phạm Thị Bích');
    expect(formatDoctorName(null, 'Chưa cập nhật')).toBe('Chưa cập nhật');
  });
});
