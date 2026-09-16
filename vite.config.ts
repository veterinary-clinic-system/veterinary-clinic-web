import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const SHARED_DIRS = [
  'components',
  'api',
  'context',
  'hooks',
  'layouts',
  'utils',
  'types',
  'routes',
];

function chunkFor(id: string): string | undefined {
  const path = id.replace(/\\/g, '/');

  if (path.includes('/node_modules/')) {
    if (path.includes('/node_modules/three/')) return 'three-garden';
    if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path)) {
      return 'react-vendor';
    }
    return undefined;
  }

  // Keep the dynamically imported renderer outside the eagerly loaded layout chunk.
  if (path.endsWith('/layouts/public/garden-scene.ts')) return 'garden-scene';
  const shared = path.match(/\/src\/([^/]+)\//);
  if (shared && SHARED_DIRS.includes(shared[1])) {
    return 'shared';
  }

  const zone = path.match(/\/src\/zones\/([^/]+)\//);
  return zone ? `zone-${zone[1]}` : undefined;
}

export default defineConfig({
  plugins: [react()],

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
    },
  },
});
