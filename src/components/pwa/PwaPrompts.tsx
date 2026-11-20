import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/basic/Button';
import { Icon } from '@/components/basic/Icon';
import { useAuth } from '@/context/AuthContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { STAFF_ROLES } from '@/types/enums';

// An installed app can stay open for days without a reload.
const UPDATE_CHECK_MS = 60 * 60 * 1000;

const CARD =
  'pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-foreground shadow-lg';

function OfflineBanner() {
  return (
    <div role="status" className={`${CARD} border-l-4 border-l-warning`}>
      <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <p>
        <strong className="font-semibold">Mất kết nối mạng.</strong> Thao tác sẽ không được lưu
        cho tới khi có mạng lại.
      </p>
    </div>
  );
}

function UpdateBanner({ onReload, onLater }: { onReload: () => void; onLater: () => void }) {
  return (
    <div role="status" className={`${CARD} border-l-4 border-l-primary`}>
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-semibold">Đã có phiên bản mới</p>
        <p className="text-muted">Tải lại để dùng bản mới nhất.</p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={onReload}>
            Tải lại
          </Button>
          <Button size="sm" variant="ghost" onClick={onLater}>
            Để sau
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Trang có ô nhập dính đáy màn hình - thẻ mời cài app sẽ che đúng chỗ khách đang gõ. */
const NO_INSTALL_PROMPT_PATHS = ['/chat', '/my/messages', '/booking'];
const ENGAGE_DELAY_MS = 20_000;

/**
 * Chỉ mời cài app khi khách đã thực sự xem trang (cuộn quá nửa màn hình hoặc ở lại 20 giây) -
 * hiện ngay lúc tải trang thì thẻ đè lên nội dung đầu tiên khách nhìn thấy (ảnh hero, hai thẻ
 * tính năng trên điện thoại).
 */
function useEngaged(): boolean {
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    if (engaged) return;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight / 2) setEngaged(true);
    };
    const timer = window.setTimeout(() => setEngaged(true), ENGAGE_DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [engaged]);
  return engaged;
}

function InstallBanner() {
  const { mode, install, dismiss } = useInstallPrompt();
  const engaged = useEngaged();
  const { pathname } = useLocation();
  if (!mode || !engaged) return null;
  if (NO_INSTALL_PROMPT_PATHS.some((path) => pathname.startsWith(path))) return null;
  return (
    <div role="region" aria-label="Cài ứng dụng" className={CARD}>
      <img src="/pwa-192x192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="flex-1">
        <p className="font-semibold">Cài VetCare lên điện thoại</p>
        {mode === 'prompt' ? (
          <p className="text-muted">Mở nhanh từ màn hình chính, như một ứng dụng.</p>
        ) : (
          <p className="text-muted">
            Bấm nút <strong>Chia sẻ</strong> của Safari rồi chọn{' '}
            <strong>Thêm vào MH chính</strong>.
          </p>
        )}
        <div className="mt-2 flex gap-2">
          {mode === 'prompt' && (
            <Button size="sm" onClick={() => void install()}>
              Cài đặt
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Không, cảm ơn
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Registers the service worker and shows the PWA notices: offline, new version
 * available, and the install invitation (visitors and pet owners only — the
 * staff console runs on shared clinic devices and stays uncluttered).
 */
export function PwaPrompts() {
  const online = useOnlineStatus();
  const { user, isLoading } = useAuth();
  const [updateDeferred, setUpdateDeferred] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, UPDATE_CHECK_MS);
    },
  });

  // A later release should ask again even after "Để sau".
  useEffect(() => {
    if (needRefresh) setUpdateDeferred(false);
  }, [needRefresh]);

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  // Chừa chỗ cuối trang bằng đúng chiều cao các thẻ, để nút/chân trang cuối cùng luôn cuộn
  // lên được phía trên chúng thay vì bị che.
  const stack = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = stack.current;
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const height = element.offsetHeight;
      root.style.setProperty('--pwa-prompts-space', height ? `${height + 12}px` : '0px');
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--pwa-prompts-space');
    };
  }, []);

  return (
    <div
      ref={stack}
      // z-40: dưới Modal/Drawer (z-50) - thẻ mời cài app không được che nút trong hộp thoại.
      className="pointer-events-none fixed inset-x-3 z-40 mx-auto flex max-w-md flex-col gap-2 sm:left-4 sm:right-auto sm:mx-0 sm:w-96"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {!online && <OfflineBanner />}
      {needRefresh && !updateDeferred && (
        <UpdateBanner
          onReload={() => void updateServiceWorker(true)}
          onLater={() => setUpdateDeferred(true)}
        />
      )}
      {!isLoading && !isStaff && online && <InstallBanner />}
    </div>
  );
}
