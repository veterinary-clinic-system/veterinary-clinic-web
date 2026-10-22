import { Link } from 'react-router-dom';
import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED_AT,
} from '../privacy-policy';

/** Trang công khai - URL này được khai báo làm chính sách quyền riêng tư trên Google Play. */
export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <span className="care-eyebrow">QUYỀN RIÊNG TƯ</span>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Chính sách quyền riêng tư
      </h1>
      <p className="mt-1 text-sm text-muted">Có hiệu lực từ {PRIVACY_POLICY_UPDATED_AT}</p>
      <p className="mt-6 text-foreground">{PRIVACY_POLICY_INTRO}</p>

      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-foreground">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        Xem danh sách chi nhánh tại{' '}
        <Link to="/branches" className="font-medium text-primary hover:underline">
          trang Chi nhánh
        </Link>
        . Muốn xoá tài khoản, đăng nhập rồi vào{' '}
        <Link to="/my/account" className="font-medium text-primary hover:underline">
          Tài khoản của tôi
        </Link>
        .
      </p>
    </div>
  );
}
