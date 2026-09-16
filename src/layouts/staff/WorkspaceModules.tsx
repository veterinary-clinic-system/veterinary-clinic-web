import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { navGroupsFor } from './nav-model';

export function WorkspaceModules() {
  const { user } = useAuth();
  const groups = navGroupsFor(user?.role).filter((group) => group.label);

  return (
    <section aria-labelledby="workspace-modules-title">
      <div className="mb-5">
        <h2 id="workspace-modules-title" className="text-xl font-semibold">
          Không gian làm việc
        </h2>
        <p className="mt-1 text-muted">Các chức năng được sắp xếp theo công việc của bạn.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group) => (
          <article key={group.label} className="staff-module">
            <div className="mb-4 flex items-start gap-3">
              <span className="staff-module-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <Icon name={group.icon ?? 'catalog'} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{group.label}</h3>
                <p className="mt-1 text-muted">{group.description}</p>
              </div>
            </div>
            <ul className="grid gap-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="staff-module-link flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 transition-colors"
                  >
                    <Icon name={item.icon} className="h-5 w-5 shrink-0 text-muted" />
                    <span className="flex-1">{item.label}</span>
                    <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
