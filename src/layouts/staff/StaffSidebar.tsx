import { Link, NavLink } from 'react-router-dom';
import { Icon, Tooltip, cn } from '@/components/basic';
import { Role } from '@/types/enums';
import { NavGroup, navGroupsFor } from './nav-model';

export interface StaffSidebarProps {
  role: Role | undefined;
  collapsed: boolean;
  onToggleCollapse: () => void;
  
  onNavigate?: () => void;
  
  bare?: boolean;
}

export function StaffSidebar({
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
  bare = false,
}: StaffSidebarProps) {
  const groups = navGroupsFor(role);

  return (
    <div className="flex h-full flex-col bg-surface">
      {!bare && (
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-2 border-b border-border px-3',
            collapsed && 'justify-center px-2',
          )}
        >
          <Link
            to="/staff"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 rounded-lg"
            aria-label="Về trang tổng quan"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="stethoscope" className="h-5 w-5" />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold leading-tight text-foreground">
                  Phòng khám thú y
                </span>
                <span className="block text-xs leading-tight text-muted">Khu vực nhân viên</span>
              </span>
            )}
          </Link>
        </div>
      )}

      <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group, index) => (
          <NavGroupSection
            key={group.label ?? `group-${index}`}
            group={group}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {!bare && (
        <div className="shrink-0 border-t border-border p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className={cn(
              'flex min-h-touch w-full items-center gap-2.5 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <Icon name="sidebar" className="h-4 w-4" />
            {!collapsed && 'Thu gọn'}
          </button>
        </div>
      )}
    </div>
  );
}

function NavGroupSection({
  group,
  collapsed,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      {group.label &&
        (collapsed ? (
          
          <>
            <span className="sr-only">{group.label}</span>
            <hr className="mx-2 mb-2 border-border" />
          </>
        ) : (
          <h2 className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
            {group.label}
          </h2>
        ))}

      <ul className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          const link = (
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-surface-muted',
                )
              }
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );

          return (
            <li key={item.to}>
              {collapsed ? (
                <Tooltip label={item.label} side="right" className="w-full">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
