import { useState } from 'react';
import { PageHeader, TabItem, Tabs } from '@/components/basic';
import { DoctorShiftsTab } from '../users/DoctorShiftsTab';
import { StaffAccountsTab } from '../users/StaffAccountsTab';

type Tab = 'accounts' | 'shifts';

const TABS: TabItem<Tab>[] = [
  { id: 'accounts', label: 'Tài khoản đăng nhập' },
  { id: 'shifts', label: 'Ca làm việc bác sĩ' },
];

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
