import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, OwnerProfile } from '@/api/account.api';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Skeleton,
  useToast,
} from '@/components/basic';
import { ImageUpload } from '@/components/ImageUpload';
import { QueryErrorState } from '@/components/QueryErrorState';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/utils/errors';

interface ProfileValues {
  fullName: string;
  email: string;
  dateOfBirth: string;
  address: string;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function ProfileCard({ profile }: { profile: OwnerProfile }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const form = useForm<ProfileValues>({
    defaultValues: {
      fullName: profile.fullName,
      email: profile.email ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      address: profile.address ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      accountApi.updateProfile({
        fullName: values.fullName.trim(),
        email: values.email.trim() || null,
        dateOfBirth: values.dateOfBirth || null,
        address: values.address.trim() || null,
        avatarUrl,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['account', 'me'], updated);
      toast.show('Đã lưu thông tin cá nhân', 'success');
    },
  });

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle as="h2">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <ImageUpload
            label="Ảnh đại diện"
            category="user-avatars"
            value={avatarUrl}
            onChange={setAvatarUrl}
          />
          <Input
            label="Số điện thoại (tên đăng nhập)"
            value={profile.phone}
            disabled
            hint="Muốn đổi số điện thoại, vui lòng liên hệ lễ tân."
          />
          <Input
            label="Họ và tên"
            autoComplete="name"
            error={form.formState.errors.fullName?.message}
            {...form.register('fullName', {
              required: 'Vui lòng nhập họ tên',
              minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            })}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            hint="Nhận xác nhận lịch hẹn và mã khôi phục mật khẩu qua Gmail."
            error={form.formState.errors.email?.message}
            {...form.register('email', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không đúng định dạng' },
            })}
          />
          <Input
            label="Ngày sinh"
            type="date"
            max={today()}
            error={form.formState.errors.dateOfBirth?.message}
            {...form.register('dateOfBirth')}
          />
          <Input label="Địa chỉ" autoComplete="street-address" {...form.register('address')} />
          {mutation.isError && (
            <Alert tone="danger">
              {getErrorMessage(mutation.error, 'Không lưu được thông tin. Vui lòng thử lại.')}
            </Alert>
          )}
          <Button type="submit" loading={mutation.isPending}>
            Lưu thay đổi
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const form = useForm<PasswordValues>();
  const mutation = useMutation({
    mutationFn: (values: PasswordValues) =>
      accountApi.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      form.reset();
      toast.show('Đã đổi mật khẩu', 'success');
    },
  });

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle as="h2">Đổi mật khẩu</CardTitle>
      </CardHeader>
      <CardBody>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            error={form.formState.errors.currentPassword?.message}
            {...form.register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.newPassword?.message}
            {...form.register('newPassword', {
              required: 'Vui lòng nhập mật khẩu mới',
              minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            })}
          />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword', {
              validate: (value, all) => value === all.newPassword || 'Mật khẩu nhập lại không khớp',
            })}
          />
          {mutation.isError && (
            <Alert tone="danger">
              {isAxiosError(mutation.error) && mutation.error.response?.status === 401
                ? 'Mật khẩu hiện tại không đúng.'
                : getErrorMessage(mutation.error, 'Không đổi được mật khẩu.')}
            </Alert>
          )}
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            Đổi mật khẩu
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function DeleteAccountCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => accountApi.deleteAccount(password),
    onSuccess: async () => {
      setOpen(false);
      queryClient.clear();
      await logout();
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    if (!open) {
      setPassword('');
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Card as="section">
      <CardHeader>
        <CardTitle as="h2">Xoá tài khoản</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-muted">
          Họ tên, số điện thoại, email, địa chỉ và mật khẩu của bạn sẽ bị xoá; bạn bị đăng xuất khỏi
          mọi thiết bị. Hồ sơ khám, đơn thuốc và hoá đơn của các bé vẫn được phòng khám lưu giữ theo
          quy định nhưng không còn gắn với thông tin của bạn. Thao tác này không hoàn tác được.{' '}
          <Link to="/privacy" className="font-medium text-primary hover:underline">
            Xem chính sách quyền riêng tư
          </Link>
        </p>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Xoá tài khoản
        </Button>
      </CardBody>

      <Modal
        open={open}
        onClose={() => !mutation.isPending && setOpen(false)}
        title="Xoá vĩnh viễn tài khoản?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              loading={mutation.isPending}
              disabled={!password}
              onClick={() => mutation.mutate()}
            >
              Xoá tài khoản
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Nhập mật khẩu để xác nhận. Lịch hẹn chưa khám phải được huỷ trước.
          </p>
          <Input
            label="Mật khẩu"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mutation.isError && (
            <Alert tone="danger">
              {getErrorMessage(mutation.error, 'Không xoá được tài khoản.')}
            </Alert>
          )}
        </div>
      </Modal>
    </Card>
  );
}

export function MyAccountPage() {
  const profile = useQuery({ queryKey: ['account', 'me'], queryFn: accountApi.me });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <span className="care-eyebrow">TÀI KHOẢN</span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Tài khoản của tôi
        </h1>
      </div>

      {profile.isLoading ? (
        <Skeleton className="h-96" />
      ) : profile.isError ? (
        <QueryErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      ) : profile.data ? (
        <ProfileCard profile={profile.data} />
      ) : null}

      <PasswordCard />
      <DeleteAccountCard />
    </div>
  );
}
