import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';

interface RegisterFormValues {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LocationState {
  from?: { pathname: string; search?: string };
}

/** Registration always creates a PET_OWNER account, so success always heads to /my/appointments
 * (or wherever the user was headed before being bounced to /login), never a staff area. */
export function RegisterPage() {
  const { registerPetOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>();

  const from = (location.state as LocationState | null)?.from;

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerPetOwner({
        phone: values.phone.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        email: values.email.trim() || undefined,
      });
      const target = from ? `${from.pathname}${from.search ?? ''}` : '/my/appointments';
      navigate(target, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Đăng ký tài khoản</h1>
      <p className="mt-1 text-muted">Tạo tài khoản để quản lý hồ sơ thú cưng và lịch hẹn của bạn.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="fullName">
            Họ và tên
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
          />
          {errors.fullName && <p className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="phone">
            Số điện thoại
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('phone', {
              required: 'Vui lòng nhập số điện thoại',
              pattern: { value: /^[0-9+\s-]{8,15}$/, message: 'Số điện thoại không hợp lệ' },
            })}
          />
          {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="email">
            Email (không bắt buộc)
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('email', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' },
            })}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="password">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
              minLength: { value: 6, message: 'Mật khẩu cần ít nhất 6 ký tự' },
            })}
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="confirmPassword">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-foreground"
            {...register('confirmPassword', {
              required: 'Vui lòng nhập lại mật khẩu',
              validate: (value) => value === watch('password') || 'Mật khẩu xác nhận không khớp',
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-primary">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
