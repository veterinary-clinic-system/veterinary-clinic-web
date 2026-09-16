import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/enums';
import { tokenStore } from '@/api/token-store';
import { decodeAccessToken } from '@/utils/jwt';
import { getErrorMessage } from '@/utils/errors';

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
      const roleHome = payload?.role === Role.PET_OWNER ? '/my/appointments' : '/staff';
      const target = from ? `${from.pathname}${from.search ?? ''}` : roleHome;
      navigate(target, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Số điện thoại hoặc mật khẩu không đúng.'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Đăng nhập</h1>
      <p className="mt-1 text-muted">Đăng nhập để đặt lịch khám và theo dõi thú cưng của bạn.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="phone">
            Số điện thoại
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
          />
          {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="password">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-primary">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
