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

export function StaffTopbar({ onOpenMobileNav }: StaffTopbarProps) {
  const { user, logout } = useAuth();
  const crumbs = useBreadcrumbs();

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
    enabled: Boolean(user?.branchId),
    staleTime: 10 * 60_000,
  });

  const branches = branchesQuery.data;

  const branchName = !user?.branchId
    ? 'Toàn hệ thống'
    : branchesQuery.isError
      ? 'Không rõ chi nhánh'
      : (branches?.find((branch) => branch.id === user.branchId)?.branchName ?? 'Đang tải...');

  const displayName = user?.phone ?? 'Tài khoản';
  const roleLabel = user ? ROLE_LABEL_VI[user.role as Role] : '';

  return (
    <header className="staff-topbar sticky top-0 z-20 flex min-h-20 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-3 sm:px-7">
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
        {}
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
