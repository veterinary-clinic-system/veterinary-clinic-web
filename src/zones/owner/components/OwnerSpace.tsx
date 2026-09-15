import { Link, NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@/components/basic';

export function OwnerSpace() {
  return (
    <div className="owner-space">
      <div className="owner-navigation">
        <Link to="/my/pets" className="owner-brand">
          <Icon name="paw" className="h-5 w-5" />
          <span>
            Góc nhỏ của bé<small>MY PET COMPANION</small>
          </span>
        </Link>
        <nav aria-label="Khu vực chủ thú cưng">
          <NavLink to="/my/pets">Hồ sơ thú cưng</NavLink>
          <NavLink to="/my/appointments">Lịch hẹn của tôi</NavLink>
          <NavLink to="/booking">Đặt lịch mới ↗</NavLink>
        </nav>
      </div>
      <Outlet />
      <div className="owner-care-note">
        <Icon name="paw" className="h-5 w-5" />
        <p>Mỗi lần thăm khám, một bước gần hơn đến cuộc sống khỏe mạnh của bé.</p>
        <Link to="/chat">Hỏi trợ lý chăm sóc →</Link>
      </div>
    </div>
  );
}
