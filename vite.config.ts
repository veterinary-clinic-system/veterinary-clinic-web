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
/**
 * Mã dùng chung giữa các zone - phải nằm ngoài mọi gói zone (xem `chunkFor`).
 *
 * `routes` ở đây chỉ còn các chốt chặn lá (RequireAuth / StaffConsoleOnly /
 * RouteFallback) mà zone nào cũng cần. Gốc router thì nằm ở `src/app/AppRoutes.tsx`:
 * nó IMPORT các zone, nên xếp nó vào gói dùng chung sẽ tạo ra vòng
 * `shared -> zone -> shared`.
 */
const SHARED_DIRS = ['components', 'api', 'context', 'hooks', 'layouts', 'utils', 'types', 'routes'];

function chunkFor(id: string): string | undefined {
  const path = id.replace(/\\/g, '/');

  if (path.includes('/node_modules/')) {
    if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path)) {
      return 'react-vendor';
    }
    return undefined;
  }

  /*
    Neo mã dùng chung vào MỘT gói cố định trước khi xét zone.
    Nếu không, Rollup được tự quyết chỗ đặt một module mà hai zone cùng dùng, và nó có
    thể nhét vào gói của zone này rồi để zone kia trỏ ngược sang - Rollup báo đúng lỗi
    đó: "Circular chunk: zone-owner -> zone-public -> zone-owner".
  */
  const shared = path.match(/\/src\/([^/]+)\//);
  if (shared && SHARED_DIRS.includes(shared[1])) {
    return 'shared';
  }

  const zone = path.match(/\/src\/zones\/([^/]+)\//);
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
    /*
      Cổng mặc định 5173, nhưng nhường cho biến môi trường `PORT` khi có: nhiều phiên
      làm việc song song trên cùng một máy sẽ đụng cổng, và một cổng cứng bắt phải tắt
      phiên kia trước khi xem được thay đổi của phiên này.
    */
    port: Number(process.env.PORT) || 5173,
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
