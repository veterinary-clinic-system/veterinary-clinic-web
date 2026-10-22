import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { Alert, Button, Input } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import { AuthCard } from '../components/AuthCard';

interface PhoneValues {
  phone: string;
}

interface ResetValues {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/** Quên mật khẩu: nhận mã 6 số qua Zalo/Gmail rồi đặt mật khẩu mới. */
export function ForgotPasswordPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const phoneForm = useForm<PhoneValues>();
  const resetForm = useForm<ResetValues>();

  const requestCode = async (value: string) => {
    setServerError(null);
    try {
      const result = await authApi.forgotPassword(value);
      setSimulated(result.simulated);
      setPhone(value);
      return true;
    } catch (error) {
      setServerError(getErrorMessage(error, 'Không gửi được mã. Vui lòng thử lại.'));
      return false;
    }
  };

  const onPhone = async ({ phone: value }: PhoneValues) => {
    await requestCode(value.trim());
  };

  const onReset = async (values: ResetValues) => {
    if (!phone) return;
    setServerError(null);
    try {
      await authApi.resetPassword({
        phone,
        code: values.code.trim(),
        newPassword: values.newPassword,
      });
      await login(phone, values.newPassword);
      navigate('/my/pets', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, 'Không đặt lại được mật khẩu. Vui lòng thử lại.'));
    }
  };

  const footer = (
    <>
      Nhớ ra mật khẩu?{' '}
      <Link to="/login" className="font-medium text-primary hover:underline">
        Đăng nhập
      </Link>
    </>
  );

  if (!phone) {
    return (
      <AuthCard
        title="Quên mật khẩu"
        description="Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác nhận qua Zalo (và Gmail nếu bạn có lưu email)."
        footer={footer}
      >
        <form onSubmit={phoneForm.handleSubmit(onPhone)} className="space-y-4" noValidate>
          <Input
            label="Số điện thoại"
            type="tel"
            autoComplete="tel"
            autoFocus
            error={phoneForm.formState.errors.phone?.message}
            {...phoneForm.register('phone', { required: 'Vui lòng nhập số điện thoại' })}
          />
          {serverError && <Alert tone="danger">{serverError}</Alert>}
          <Button type="submit" fullWidth size="lg" loading={phoneForm.formState.isSubmitting}>
            Gửi mã xác nhận
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Đặt mật khẩu mới"
      description={`Nếu ${phone} đã đăng ký, mã 6 số vừa được gửi tới bạn. Mã có hiệu lực trong 10 phút.`}
      footer={footer}
    >
      <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4" noValidate>
        {simulated && (
          <Alert tone="warning">
            Máy chủ đang ở chế độ thử nghiệm: mã chỉ được ghi vào log máy chủ, không gửi thật.
          </Alert>
        )}
        <Input
          label="Mã xác nhận"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          error={resetForm.formState.errors.code?.message}
          {...resetForm.register('code', {
            required: 'Vui lòng nhập mã xác nhận',
            pattern: { value: /^\s*\d{6}\s*$/, message: 'Mã xác nhận gồm 6 chữ số' },
          })}
        />
        <Input
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          error={resetForm.formState.errors.newPassword?.message}
          {...resetForm.register('newPassword', {
            required: 'Vui lòng nhập mật khẩu mới',
            minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
          })}
        />
        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          error={resetForm.formState.errors.confirmPassword?.message}
          {...resetForm.register('confirmPassword', {
            validate: (value, all) => value === all.newPassword || 'Mật khẩu nhập lại không khớp',
          })}
        />
        {serverError && <Alert tone="danger">{serverError}</Alert>}
        <Button type="submit" fullWidth size="lg" loading={resetForm.formState.isSubmitting}>
          Đặt mật khẩu và đăng nhập
        </Button>
      </form>

      <p className="mt-5 border-t border-border pt-5 text-sm text-muted">
        Chưa nhận được mã?{' '}
        <button
          type="button"
          className="font-medium text-primary hover:underline disabled:text-muted disabled:no-underline"
          disabled={resent}
          onClick={async () => {
            if (await requestCode(phone)) setResent(true);
          }}
        >
          {resent ? 'Đã gửi lại mã' : 'Gửi lại mã'}
        </button>
        {' · '}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => {
            setPhone(null);
            setServerError(null);
            setResent(false);
          }}
        >
          Đổi số điện thoại
        </button>
      </p>
    </AuthCard>
  );
}
