import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Input } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import { AuthCard } from '../components/AuthCard';

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

/**
 * Đăng ký luôn tạo tài khoản PET_OWNER, nên thành công thì về `/my/pets` (hoặc nơi
 * người dùng định tới trước khi bị đẩy sang đăng nhập) - không bao giờ về khu nhân viên.
 *
 * Năm trường, không hơn: họ tên, số điện thoại, email tuỳ chọn, mật khẩu và xác nhận.
 * Thông tin thú cưng KHÔNG hỏi ở đây - người dùng chưa thấy lý do phải nhập, và mỗi
 * trường thêm vào ở bước này là thêm một chỗ để bỏ dở.
 */
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
      const target = from ? `${from.pathname}${from.search ?? ''}` : '/my/pets';
      navigate(target, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'));
    }
  };

  return (
    <AuthCard
      title="Đăng ký tài khoản"
      description="Tạo tài khoản để quản lý hồ sơ thú cưng, lịch hẹn và đơn thuốc."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Họ và tên"
          autoComplete="name"
          autoFocus
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
        />

        <Input
          label="Số điện thoại"
          type="tel"
          autoComplete="tel"
          hint="Dùng làm tên đăng nhập, và để phòng khám liên hệ khi cần đổi lịch."
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Vui lòng nhập số điện thoại',
            pattern: { value: /^[0-9+\s-]{8,15}$/, message: 'Số điện thoại không hợp lệ' },
          })}
        />

        <Input
          label="Email (không bắt buộc)"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' },
          })}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          hint="Ít nhất 6 ký tự."
          error={errors.password?.message}
          {...register('password', {
            required: 'Vui lòng nhập mật khẩu',
            minLength: { value: 6, message: 'Mật khẩu cần ít nhất 6 ký tự' },
          })}
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Vui lòng nhập lại mật khẩu',
            validate: (value) => value === watch('password') || 'Mật khẩu xác nhận không khớp',
          })}
        />

        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Đăng ký
        </Button>
      </form>
    </AuthCard>
  );
}
