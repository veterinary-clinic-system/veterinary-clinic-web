import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { billingApi } from '@/api/billing.api';
import { Button, DataTable, Icon, PageHeader, Select, StatusBadge } from '@/components/basic';
import type { DataColumn } from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { Invoice } from '@/types/models';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  INVOICE_SOURCE_LABEL_VI,
  INVOICE_STATUS_LABEL_VI,
  INVOICE_STATUS_VARIANT,
  PAYMENT_METHOD_LABEL_VI,
} from '@/utils/labels';

const LIMIT = 20;

/**
 * Danh sách hoá đơn có phân trang.
 *
 * Từ P8-T1 cột "Thành tiền" đọc `totalAmount` - con số backend đã chốt lúc lập hoá đơn,
 * có mặt trên mọi dòng của danh sách. Trước đó trang này cố tình bỏ trống cột tổng vì
 * chỉ cộng được từ `items`, mà quan hệ đó không chắc được nạp trong danh sách.
 *
 * Dựng trên `DataTable` như mọi trang danh sách của zone quản trị (tài liệu kiến trúc
 * mục 5.3). Bản trước tự dựng lấy `<table>`, `<select>` và cặp nút phân trang bằng tay,
 * nên lệch khỏi phần còn lại của hệ thống ở ba chỗ đáng kể: không có trạng thái lỗi
 * (máy chủ hỏng hiện ra y hệt "chưa có hoá đơn nào"), chữ "Đang tải…" thay cho skeleton,
 * và huy hiệu thanh toán tô bằng màu `triage-*` - vốn dành riêng cho mức độ ưu tiên cấp
 * cứu, không phải một bảng màu dùng chung.
 */
export function BillingListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [paid, setPaid] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const listQuery = useQuery({
    queryKey: ['invoices', branchId, paid, page],
    queryFn: () =>
      billingApi.list({
        page,
        limit: LIMIT,
        branchId: branchId || undefined,
        paid: paid === '' ? undefined : paid === 'true',
      }),
    placeholderData: (prev) => prev,
  });

  const columns: DataColumn<Invoice>[] = [
    {
      key: 'invoiceCode',
      header: 'Mã hoá đơn',
      render: (invoice) => (
        <Link
          to={`/staff/billing/${invoice.id}`}
          onClick={(event) => event.stopPropagation()}
          className="font-mono text-xs text-primary hover:underline"
        >
          {invoice.invoiceCode}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      render: (invoice) => invoice.customer?.fullName ?? 'Khách vãng lai',
    },
    {
      key: 'source',
      header: 'Nguồn',
      hideBelow: 'md',
      render: (invoice) => INVOICE_SOURCE_LABEL_VI[invoice.source],
    },
    {
      key: 'paidAt',
      header: 'Thanh toán lúc',
      hideBelow: 'lg',
      render: (invoice) => (invoice.paidAt ? formatDateTime(invoice.paidAt) : '—'),
    },
    {
      key: 'totalAmount',
      header: 'Thành tiền',
      align: 'right',
      render: (invoice) => (
        <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Phương thức',
      hideBelow: 'md',
      render: (invoice) =>
        invoice.paymentMethod ? PAYMENT_METHOD_LABEL_VI[invoice.paymentMethod] : '—',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      /*
        Đọc `status` chứ không phải cờ `paid`: bản trước gộp "Trả một phần" vào "Chưa
        thanh toán", tức là giấu mất khoản tiền khách đã đưa trên chính màn hình dùng
        để đối soát. `INVOICE_STATUS_VARIANT` là bản đồ màu dùng chung với trang chi
        tiết, nên một hoá đơn không đổi màu khi bấm vào xem.

        Huy hiệu có CHẤM MÀU CỘNG CHỮ: người không phân biệt được xanh với vàng vẫn đọc
        được trạng thái - đây là hoá đơn, đọc nhầm là mất tiền.
      */
      render: (invoice) => (
        <StatusBadge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
          {INVOICE_STATUS_LABEL_VI[invoice.status]}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-stack">
      <PageHeader
        title="Hoá đơn"
        description="Hoá đơn đã lập tại quầy và từ phiếu khám, lọc theo chi nhánh và tình trạng thanh toán."
        actions={
          <Link to="/staff/pos">
            <Button>
              <Icon name="cart" className="h-4 w-4" />
              Bán hàng tại quầy
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={listQuery.data?.data ?? []}
        getRowId={(invoice) => invoice.id}
        loading={listQuery.isLoading}
        error={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        page={listQuery.data?.page}
        limit={listQuery.data?.limit}
        total={listQuery.data?.total}
        onPageChange={setPage}
        onRowClick={(invoice) => navigate(`/staff/billing/${invoice.id}`)}
        emptyTitle="Không có hoá đơn nào khớp bộ lọc"
        emptyDescription="Thử bỏ bớt điều kiện lọc, hoặc lập hoá đơn mới từ màn hình bán hàng."
        emptyAction={
          <Link to="/staff/pos">
            <Button variant="secondary">Mở màn hình bán hàng</Button>
          </Link>
        }
        toolbar={
          <>
            <Select
              label="Chi nhánh"
              value={branchId}
              onChange={(value) => {
                setBranchId(value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả chi nhánh' },
                ...(branchesQuery.data ?? []).map((branch) => ({
                  value: branch.id,
                  label: branch.branchName,
                })),
              ]}
            />
            <Select
              label="Thanh toán"
              value={paid}
              onChange={(value) => {
                setPaid(value as '' | 'true' | 'false');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'true', label: 'Đã thanh toán' },
                { value: 'false', label: 'Chưa thanh toán' },
              ]}
            />
          </>
        }
      />
    </div>
  );
}
