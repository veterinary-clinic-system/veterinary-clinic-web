import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          raised: 'rgb(var(--color-surface-raised) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-foreground) / <alpha-value>)',

        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          soft: 'rgb(var(--color-info-soft) / <alpha-value>)',
        },

        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',

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
      
      boxShadow: {
        sm: '0 1px 2px 0 rgb(17 27 33 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(17 27 33 / 0.06), 0 1px 2px -1px rgb(17 27 33 / 0.04)',
        md: '0 4px 12px -2px rgb(17 27 33 / 0.08)',
        
        pop: '0 8px 24px -6px rgb(17 27 33 / 0.14), 0 2px 6px -2px rgb(17 27 33 / 0.08)',
      },
      
      height: {
        row: 'var(--row-height)',
      },
      minHeight: {
        row: 'var(--row-height)',
        
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      padding: {
        card: 'var(--card-padding)',
      },
      gap: {
        stack: 'var(--stack-gap)',
      },
      fontSize: {
        data: ['var(--data-font-size)', { lineHeight: '1.25rem' }],
      },
    },
  },
  plugins: [],
} satisfies Config;
