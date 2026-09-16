import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/basic';
import { cloudinaryImage } from '@/utils/cloudinary-assets';

export interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  
  footer: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="pet-auth mx-auto w-full px-4">
      <aside className="pet-auth-story">
        <img src={cloudinaryImage('images/pets-photoreal-v1.png')} alt="Chó và mèo bên nhau" />
        <div>
          <span className="text-xs tracking-widest">GÓC NHỎ CỦA BÉ</span>
          <h2 className="mt-3">Yêu thương gần hơn.<br />Chăm sóc dễ hơn.</h2>
          <p>Hồ sơ sức khỏe, lịch hẹn và hành trình lớn lên của bé — tất cả trong một nơi.</p>
        </div>
      </aside>
      <div className="pet-auth-form">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Về trang chủ">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Icon name="stethoscope" className="h-5 w-5" />
          </span>
          <span className="font-semibold text-foreground">Phòng khám thú y</span>
        </Link>

        <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>

        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-5 text-center text-sm text-muted">{footer}</p>
    </div>
  );
}
