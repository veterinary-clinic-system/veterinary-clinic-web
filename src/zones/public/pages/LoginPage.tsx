import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { tokenStore } from '@/api/token-store';
import { Alert, Button, Input } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { STAFF_ROLES } from '@/types/enums';
import { getErrorMessage } from '@/utils/errors';
import { decodeAccessToken } from '@/utils/jwt';
import { AuthCard } from '../components/AuthCard';

interface LoginFormValues {
  phone: string;
  password: string;
}

interface LocationState {
  from?: { pathname: string; search?: string };
}

/**
 * On success, redirects back to `location.state.from` (the shape RequireAuth passes,
 * see src/routes/RequireAuth.tsx) or a role-based default. The role is read straight off
 * the freshly-stored access token via tokenStore/decodeAccessToken instead of the
 * post-login `user` from useAuth(), since that context update may not have flushed to
 * this render yet by the time login() resolves.
 */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const from = (location.state as LocationState | null)?.from;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.phone.trim(), values.password);
      const accessToken = tokenStore.getAccessToken();
      const payload = accessToken ? decodeAccessToken(accessToken) : null;
      const isStaff = !!payload && STAFF_ROLES.includes(payload.role);
      const roleHome = isStaff ? '/staff' : '/my/pets';
      // Nhân viên luôn về /staff kể cả khi `from` trỏ tới một trang công khai - nếu đi
      // theo `from`, `StaffConsoleOnly` cũng lập tức đẩy họ về đây, chỉ tốn một nhịp.
      const target = from && !isStaff ? `${from.pathname}${from.search ?? ''}` : roleHome;
      navigate(target, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Số điện thoại hoặc mật khẩu không đúng.'));
    }
  };

  return (
    <AuthCard
      title="Đăng nhập"
      description="Theo dõi hồ sơ thú cưng, lịch hẹn và đơn thuốc của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Số điện thoại"
          type="tel"
          autoComplete="tel"
          autoFocus
          error={errors.phone?.message}
          {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
        />

        {/*
          Lỗi từ máy chủ đặt NGAY TRÊN nút gửi, không phải ở đầu biểu mẫu: mắt người dùng
          đang ở nút vừa bấm, và một dòng lỗi cách đó ba trường thường bị bỏ qua hẳn.
        */}
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>

      <p className="mt-5 border-t border-border pt-5 text-sm text-muted">
        Bạn không cần tài khoản để đặt lịch khám.{' '}
        <Link to="/booking" className="font-medium text-primary hover:underline">
          Đặt lịch ngay
        </Link>
      </p>
    </AuthCard>
  );
}
