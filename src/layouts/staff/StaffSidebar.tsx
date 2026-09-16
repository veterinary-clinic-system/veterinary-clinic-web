import { useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
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

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export function StaffSidebar({
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
  bare = false,
}: StaffSidebarProps) {
  const [search, setSearch] = useState('');
  const query = normalize(search.trim());
  const groups = navGroupsFor(role)
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !query || normalize(`${group.label ?? ''} ${item.label}`).includes(query),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="staff-sidebar flex h-full flex-col">
      <Link
        to="/staff"
        onClick={onNavigate}
        className={cn(
          'flex min-h-20 shrink-0 items-center gap-3 px-5 py-4',
          collapsed && 'justify-center px-2',
        )}
        aria-label="VetCare — Tổng quan quản lý"
      >
        <span className="staff-brand-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Icon name="stethoscope" className="h-6 w-6" />
        </span>
        {!collapsed && (
          <span>
            <span className="block text-xl font-bold tracking-tight">
              VetCare<span className="text-emerald-300">.</span>
            </span>
            <span className="block text-base text-slate-300">Không gian quản lý</span>
          </span>
        )}
      </Link>
      {!collapsed && (
        <div className="px-4 pb-4 pt-2">
          <label className="staff-nav-search flex items-center gap-2 rounded-xl px-3">
            <Icon name="search" className="h-5 w-5 shrink-0" />
            <input
              type="search"
              aria-label="Tìm chức năng"
              placeholder="Tìm chức năng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full min-w-0 bg-transparent text-base text-white outline-none placeholder:text-slate-300"
            />
          </label>
        </div>
      )}
      <nav aria-label="Điều hướng chính" className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <NavGroupSection
            key={group.label ?? 'overview'}
            group={group}
            collapsed={collapsed}
            searching={Boolean(query) && !collapsed}
            onNavigate={onNavigate}
          />
        ))}
        {groups.length === 0 && (
          <p className="px-3 py-6 text-base text-slate-300">
            Không tìm thấy chức năng. Thử từ khóa khác.
          </p>
        )}
      </nav>
      {!bare && (
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onToggleCollapse();
            }}
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            className={cn(
              'flex min-h-touch w-full items-center gap-3 rounded-xl px-3 text-base text-slate-300 transition-colors hover:bg-white/10 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            <Icon name="sidebar" className="h-5 w-5" />
            {!collapsed && 'Thu gọn menu'}
          </button>
        </div>
      )}
    </div>
  );
}

function NavGroupSection({
  group,
  collapsed,
  searching,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  searching: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const id = useId();
  const active = group.items.some((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  const [fold, setFold] = useState<{ path: string; closed: boolean } | null>(null);
  const open =
    collapsed || searching || !group.label || (fold?.path === pathname ? !fold.closed : active);

  return (
    <section className="mb-2 last:mb-0">
      {group.label &&
        (collapsed ? (
          <>
            <span className="sr-only">{group.label}</span>
            <hr className="mx-2 my-3 border-white/10" />
          </>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setFold({ path: pathname, closed: open })}
            className={cn(
              'staff-group-toggle flex min-h-12 w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-base font-semibold',
              active && 'staff-group-active',
            )}
          >
            <Icon name={group.icon ?? 'catalog'} className="h-5 w-5 shrink-0" />
            <span className="flex-1">{group.label}</span>
            <Icon
              name="chevron-down"
              className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
            />
          </button>
        ))}
      <ul
        id={id}
        hidden={!open}
        className={cn(
          'space-y-1',
          group.label &&
            !collapsed &&
            'staff-group-items mb-3 ml-5 mt-1 border-l border-white/15 pl-2',
        )}
      >
        {group.items.map((item) => {
          const link = (
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              aria-label={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'staff-nav-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-base transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive && 'is-active',
                )
              }
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
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
    </section>
  );
}
