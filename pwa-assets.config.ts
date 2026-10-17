import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Run `npm run pwa:assets` after changing public/pwa-icon.svg; the PNGs are committed.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0d9488' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0d9488' } },
  },
  images: ['public/pwa-icon.svg'],
});
