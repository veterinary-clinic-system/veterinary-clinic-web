import { useState } from 'react';
import { PageHeader, TabItem, Tabs } from '@/components/basic';
import { DoctorShiftsTab } from '../users/DoctorShiftsTab';
import { StaffAccountsTab } from '../users/StaffAccountsTab';

type Tab = 'accounts' | 'shifts';

const TABS: TabItem<Tab>[] = [
  { id: 'accounts', label: 'Tài khoản đăng nhập' },
  { id: 'shifts', label: 'Ca làm việc bác sĩ' },
];

/**
 * Chỉ ADMIN: tài khoản nhân viên và lịch làm việc của bác sĩ.
 *
 * Tiêu đề là "Tài khoản" chứ không phải "Nhân sự" như bản trước - đó là nhãn của mục
 * này trên sidebar và trên breadcrumb, và `/staff/employees` mới là màn hình hồ sơ nhân
 * sự. Hai trang mang cùng một tên là cách nhanh nhất để người dùng mở nhầm.
 *
 * Trang chỉ còn là cái vỏ: hai tab nằm ở `../users/`. Bản trước gộp cả bốn khối (danh
 * sách, biểu mẫu tạo, ca làm việc, lịch nghỉ) vào một file 451 dòng.
 */
export function UsersAdminPage() {
  const [tab, setTab] = useState<Tab>('accounts');

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Tài khoản"
        description="Tài khoản đăng nhập của nhân viên và khách hàng, cùng lịch làm việc của bác sĩ."
      />

      <Tabs items={TABS} value={tab} onChange={setTab} />

      {tab === 'accounts' ? <StaffAccountsTab /> : <DoctorShiftsTab />}
    </div>
  );
}
