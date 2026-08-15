import type { Config } from 'tailwindcss';

/**
 * Bảng token của Tailwind. Nguồn giá trị thật nằm ở các CSS custom property trong
 * `src/index.css` - file này chỉ nối chúng vào tên lớp của Tailwind, nên đổi giao diện
 * là đổi ở đó chứ không phải ở đây.
 *
 * Thang màu phân loại ưu tiên (`triage`) thì KHÔNG đi qua biến: năm màu này mang nghĩa
 * nghiệp vụ cố định (prompt.md mục 6), không phải một lựa chọn thẩm mỹ được đổi.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--color-surface-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        // The 5-color AI triage scale (prompt.md Section 6) - fixed semantics, not a
        // DESIGN.md concern, but kept here so Badge/Table cells can reference
        // `bg-triage-red` etc. consistently everywhere.
        triage: {
          red: '#DC2626',
          orange: '#EA580C',
          yellow: '#CA8A04',
          green: '#16A34A',
          blue: '#2563EB',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 0.25rem)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Đổ bóng rất nhẹ: thẻ nổi lên khỏi nền mà không trông như hộp thoại nổi.
      boxShadow: {
        sm: '0 1px 2px 0 rgb(17 27 33 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(17 27 33 / 0.06), 0 1px 2px -1px rgb(17 27 33 / 0.04)',
        md: '0 4px 12px -2px rgb(17 27 33 / 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
