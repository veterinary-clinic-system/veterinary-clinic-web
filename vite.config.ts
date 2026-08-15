import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Gom các gói JavaScript theo ZONE (`src/zones/<ten>/`) thay vì để mỗi trang thành một
 * gói riêng.
 *
 * Mỗi trang được nạp qua `lazy()` nên Rollup mặc định cắt ra một gói cho từng trang -
 * 40 gói tí hon, và một người dùng đi qua bốn màn hình của cùng một luồng phải chờ bốn
 * lượt đi về mạng. Gom theo zone khớp với cách người ta dùng thật: khách ở lại trong
 * site công khai, bác sĩ ở lại trong khu lâm sàng, quản trị ở lại trong khu quản trị -
 * hiếm khi ai đó nhảy qua lại giữa các zone trong một phiên.
 *
 * `react-vendor` tách riêng vì nó gần như không bao giờ đổi: trình duyệt giữ lại được
 * qua các lần triển khai, trong khi mã của ứng dụng thì đổi liên tục.
 */
function chunkFor(id: string): string | undefined {
  if (id.includes('/node_modules/')) {
    if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
      return 'react-vendor';
    }
    return undefined;
  }

  const zone = id.replace(/\\/g, '/').match(/\/src\/zones\/([^/]+)\//);
  return zone ? `zone-${zone[1]}` : undefined;
}

export default defineConfig({
  plugins: [react()],
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
    port: 5173,
    proxy: {
      // Lets the dev server call the NestJS API without CORS friction.
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
