import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const SHARED_DIRS = [
  'components',
  'api',
  'context',
  'hooks',
  'layouts',
  'utils',
  'routes',
];

function chunkFor(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/');

  if (normalized.includes('/node_modules/')) {
    if (normalized.includes('/node_modules/three/')) return 'three-garden';
    // Keep dynamically imported workbox-window in its own lazy chunk.
    if (normalized.includes('/node_modules/workbox-window/')) return undefined;
    if (
      /\/node_modules\/(react|react-dom|react-router|react-router-dom|@remix-run\/router|scheduler)\//.test(
        normalized,
      )
    ) {
      return 'react-vendor';
    }
    // Anchor all remaining third-party packages outside zone chunks so Rollup
    // never places shared libraries (e.g. date-fns, react-hook-form) inside a
    // zone-* chunk and creates a circular shared <-> zone-* import.
    return 'vendor';
  }

  // Keep the dynamically imported renderer outside the eagerly loaded layout chunk.
  if (normalized.endsWith('/layouts/public/garden-scene.ts')) return 'garden-scene';

  // Keep pure domain enums/types/role constants in a leaf chunk with zero UI dependencies.
  if (normalized.includes('/src/types/')) return 'shared-types';

  const shared = normalized.match(/\/src\/([^/]+)\//);
  if (shared && SHARED_DIRS.includes(shared[1])) {
    return 'shared';
  }

  const zone = normalized.match(/\/src\/zones\/([^/]+)\//);
  return zone ? `zone-${zone[1]}` : undefined;
}

const THEME_COLOR = '#0d9488';

const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false,
  manifest: {
    name: 'VetCare – Phòng khám thú y',
    short_name: 'VetCare',
    description: 'Đặt lịch, theo dõi hồ sơ thú cưng và nhắn tin với bác sĩ thú y.',
    lang: 'vi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: THEME_COLOR,
    background_color: '#ffffff',
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // App shell only; the large photos and the video are cached on first use instead.
    // (Manifest icons are added automatically.)
    globPatterns: ['**/*.{js,css,html,svg,ico,woff2}', 'apple-touch-icon-*.png'],
    globIgnores: ['videos/**'],
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\/(api|uploads|socket\.io|docs)(\/|$)/],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      // Medical and customer data on shared clinic devices: never cached.
      // (Workbox serialises these callbacks into the worker, so no outer variables.)
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /^\/(api|uploads|socket\.io)(\/|$)/.test(url.pathname),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /^\/(images|doctors)\//.test(url.pathname),
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

export default defineConfig({
  plugins: [react(), pwa],

  test: {
    environment: 'jsdom',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: chunkFor },
    },
  },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3010',
        ws: true,
      },
    },
  },
});
