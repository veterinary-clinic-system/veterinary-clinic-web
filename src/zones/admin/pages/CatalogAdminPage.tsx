import { useState } from 'react';
import { DiseasesTab } from '../catalog/tabs/DiseasesTab';
import { InventoryTab } from '../catalog/tabs/InventoryTab';
import { MedicationsTab } from '../catalog/tabs/MedicationsTab';
import { ServicesTab } from '../catalog/tabs/ServicesTab';
import { VaccinesTab } from '../catalog/tabs/VaccinesTab';

type Tab = 'services' | 'medications' | 'vaccines' | 'diseases' | 'inventory';

const TABS: { id: Tab; label: string }[] = [
  { id: 'services', label: 'Dịch vụ' },
  { id: 'medications', label: 'Thuốc' },
  { id: 'vaccines', label: 'Vaccine' },
  { id: 'diseases', label: 'Nhóm bệnh' },
  { id: 'inventory', label: 'Tồn kho' },
];

/**
 * Admin-only tabbed catalog management: services, medications, diseases, inventory.
 *
 * Trang này chỉ LẮP RÁP: mỗi tab là một component độc lập trong `../catalog/tabs/` - tự
 * có state, truy vấn và mutation riêng, không đọc trạng thái của tab khác. `PAGE_SIZE`,
 * `TabPagination`, `CategorySelect` dùng chung giữa nhiều tab nằm ở `../catalog/shared`.
 * Trước đây tất cả nằm chung một file 1109 dòng.
 */
export function CatalogAdminPage() {
  const [tab, setTab] = useState<Tab>('services');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Danh mục</h1>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'services' && <ServicesTab />}
      {tab === 'medications' && <MedicationsTab />}
      {tab === 'vaccines' && <VaccinesTab />}
      {tab === 'diseases' && <DiseasesTab />}
      {tab === 'inventory' && <InventoryTab />}
    </div>
  );
}
