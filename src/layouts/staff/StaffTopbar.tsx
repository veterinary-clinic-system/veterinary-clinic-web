import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { Avatar, Breadcrumb, DropdownMenu, Icon, cn } from '@/components/basic';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';
import { ROLE_LABEL_VI } from '@/utils/labels';
import { useBreadcrumbs } from './use-breadcrumbs';

export interface StaffTopbarProps {
  onOpenMobileNav: () => void;
}

/**
 * Thanh trên của khu nhân viên.
 *
 * Ba thứ được thêm so với bản cũ (vốn chỉ có số điện thoại và nút đăng xuất trần):
 *
 * - **Breadcrumb** suy ra từ URL, nên trang chi tiết nào cũng biết đường về danh sách
 *   của nó. Trước đây từ `/staff/appointments/:id` chỉ còn nút Back của trình duyệt.
 * - **Ngữ cảnh chi nhánh.** Hệ thống nhiều chi nhánh mà không hiện đang làm việc tại
 *   chi nhánh nào thì mọi con số trên màn hình đều mơ hồ.
 * - **Vai trò trong menu tài khoản.** Ở phòng khám, nhiều người dùng chung một máy;
 *   biết đang đăng nhập bằng tài khoản nào là chuyện an toàn dữ liệu, không phải trang
 *   trí.
 */
export function StaffTopbar({ onOpenMobileNav }: StaffTopbarProps) {
  const { user, logout } = useAuth();
  const crumbs = useBreadcrumbs();

  /*
    Chỉ hỏi danh sách chi nhánh khi tài khoản CÓ gắn chi nhánh. ADMIN không gắn chi
    nhánh nào thì không cần gọi API chỉ để hiện chữ "Toàn hệ thống".
  */
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
    enabled: Boolean(user?.branchId),
    staleTime: 10 * 60_000,
  });

  const branchName = user?.branchId
    ? (branches?.find((branch) => branch.id === user.branchId)?.branchName ?? 'Đang tải...')
    : 'Toàn hệ thống';

  const displayName = user?.phone ?? 'Tài khoản';
  const roleLabel = user ? ROLE_LABEL_VI[user.role as Role] : '';

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Mở menu điều hướng"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-surface-muted lg:hidden"
      >
        <Icon name="menu" />
      </button>

      <Breadcrumb items={crumbs} className="flex-1" />

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/*
          Ngữ cảnh chi nhánh là THÔNG TIN, không phải bộ chọn: tài khoản nhân viên gắn
          cứng với một chi nhánh ở backend, đổi chi nhánh là việc của quản trị viên.
          Làm nó trông giống một dropdown sẽ hứa một thao tác không tồn tại.
        */}
        <span
          className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted md:inline-flex"
          title="Chi nhánh đang làm việc"
        >
          <Icon name="building" className="h-4 w-4" />
          <span className="max-w-[12rem] truncate">{branchName}</span>
        </span>

        <NotificationBell />

        <DropdownMenu
          items={[
            { id: 'branch', label: `Chi nhánh: ${branchName}`, icon: 'building', disabled: true },
            { id: 'logout', label: 'Đăng xuất', icon: 'logout', onSelect: () => void logout() },
          ]}
          trigger={({ ref, onClick, ...aria }) => (
            <button
              ref={ref}
              type="button"
              onClick={onClick}
              {...aria}
              className={cn(
                'flex min-h-touch items-center gap-2 rounded-lg pl-1 pr-2 transition-colors hover:bg-surface-muted',
              )}
            >
              <Avatar name={displayName} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-foreground">
                  {displayName}
                </span>
                <span className="block text-xs leading-tight text-muted">{roleLabel}</span>
              </span>
              <Icon name="chevron-down" className="h-4 w-4 text-muted" />
            </button>
          )}
        />
      </div>
    </header>
  );
}
