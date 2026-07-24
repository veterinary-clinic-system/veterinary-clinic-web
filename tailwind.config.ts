import type { Config } from 'tailwindcss';

/**
 * PLACEHOLDER token set. DESIGN.md (repo root) is the source of truth for colors,
 * typography, spacing and border radii per prompt.md Section 7.3, but it wasn't in the
 * repo yet when this project was scaffolded. Everything below is wired through CSS
 * custom properties (see src/index.css) specifically so that once DESIGN.md exists,
 * updating those variables (and the `triage` palette below, if the doc specifies
 * different values) is enough to re-skin the whole app - no component changes needed.
 * Do not build new components against DESIGN.md until this file has been updated to
 * match it.
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
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
