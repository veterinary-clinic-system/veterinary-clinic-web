import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductListParams, categoriesApi, productsApi } from '@/api/products.api';
import { Badge, Button, Input, Modal, Select, Table, Textarea, useToast } from '@/components/basic';
import type { Column, SortOrder } from '@/components/basic';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ItemType, Product } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { flattenCategories } from '@/utils/categories';
import { formatCurrency } from '@/utils/format';

const LIMIT = 20;

type ActiveFilter = '' | 'true' | 'false';

interface ProductFormState {
  itemName: string;
  describe: string;
  unitPrice: string;
  categoryId: string;
  sku: string;
  brand: string;
  unit: string;
  costPrice: string;
  minimumStock: string;
}

const EMPTY_FORM: ProductFormState = {
  itemName: '',
  describe: '',
  unitPrice: '',
  categoryId: '',
  sku: '',
  brand: '',
  unit: '',
  costPrice: '',
  minimumStock: '',
};

/** SRS FR-16 — quản lý hàng hoá bán lẻ. */
export function ProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('itemName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);

  const debouncedSearch = useDebouncedValue(search, 300);

  const categoriesQuery = useQuery({
    queryKey: ['categories', ItemType.PRODUCT],
    queryFn: () => categoriesApi.tree({ itemType: ItemType.PRODUCT }),
  });
  const categoryOptions = flattenCategories(categoriesQuery.data ?? []);

  const params: ProductListParams = {
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    categoryId: categoryFilter || undefined,
    active: activeFilter === '' ? undefined : activeFilter === 'true',
  };

  const listQuery = useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
    placeholderData: (prev) => prev,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        itemName: form.itemName,
        describe: form.describe || undefined,
        unitPrice: Number(form.unitPrice) || 0,
        categoryId: form.categoryId || null,
        sku: form.sku,
        brand: form.brand || undefined,
        unit: form.unit,
        costPrice: Number(form.costPrice) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      };
      return editing ? productsApi.update(editing.id, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.', 'success');
      closeForm();
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (product: Product) =>
      productsApi.update(product.id, { active: !product.active }),
    onSuccess: (updated) => {
      toast.show(updated.active ? 'Đã kinh doanh lại.' : 'Đã ngưng kinh doanh.', 'success');
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      itemName: product.item.itemName,
      describe: product.item.describe ?? '',
      unitPrice: String(product.item.unitPrice),
      categoryId: product.item.categoryId ?? '',
      sku: product.sku,
      brand: product.brand ?? '',
      unit: product.unit,
      costPrice: String(product.costPrice),
      minimumStock: String(product.minimumStock),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  // Bán lỗ là nghiệp vụ có thật (xả hàng cận hạn) nên chỉ CẢNH BÁO, không chặn.
  const sellingBelowCost =
    form.costPrice !== '' && form.unitPrice !== '' && Number(form.costPrice) > Number(form.unitPrice);

  const columns: Column<Product>[] = [
    {
      key: 'code',
      header: 'Mã',
      render: (row) => <span className="font-mono text-xs text-muted">{row.item.code}</span>,
    },
    { key: 'sku', header: 'SKU', sortable: true, render: (row) => <span className="font-mono text-xs">{row.sku}</span> },
    { key: 'itemName', header: 'Tên sản phẩm', sortable: true, render: (row) => row.item.itemName },
    { key: 'brand', header: 'Thương hiệu', render: (row) => row.brand ?? '—' },
    {
      key: 'category',
      header: 'Danh mục',
      render: (row) =>
        row.item.category ? <Badge variant="outline">{row.item.category.categoryName}</Badge> : '—',
    },
    { key: 'unit', header: 'Đơn vị' },
    {
      key: 'unitPrice',
      header: 'Giá bán',
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatCurrency(row.item.unitPrice)}</span>,
    },
    {
      key: 'costPrice',
      header: 'Giá vốn',
      sortable: true,
      render: (row) => <span className="tabular-nums text-muted">{formatCurrency(row.costPrice)}</span>,
    },
    {
      key: 'minimumStock',
      header: 'Tồn tối thiểu',
      render: (row) => <span className="tabular-nums">{row.minimumStock}</span>,
    },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'destructive'}>
          {row.active ? 'Đang bán' : 'Ngưng bán'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Button
            size="sm"
            variant={row.active ? 'destructive' : 'secondary'}
            onClick={() => toggleActiveMutation.mutate(row)}
          >
            {row.active ? 'Ngưng' : 'Mở lại'}
          </Button>
        </div>
      ),
    },
  ];

  const data = listQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sản phẩm</h1>
        <Button onClick={openCreate}>Thêm sản phẩm</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Input
          label="Tìm kiếm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tên sản phẩm, SKU hoặc mã…"
          className="w-72"
        />
        <Select
          label="Danh mục"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            setPage(1);
          }}
          options={[{ value: '', label: 'Tất cả' }, ...categoryOptions]}
        />
        <Select
          label="Trạng thái"
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value as ActiveFilter);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Tất cả' },
            { value: 'true', label: 'Đang bán' },
            { value: 'false', label: 'Ngưng bán' },
          ]}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setSearch('');
            setCategoryFilter('');
            setActiveFilter('');
            setPage(1);
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        getRowId={(row) => row.id}
        loading={listQuery.isLoading}
        emptyMessage="Không tìm thấy sản phẩm nào."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextOrder) => {
          setSortBy(nextSortBy);
          setSortOrder(nextOrder);
          setPage(1);
        }}
        page={data?.page}
        limit={data?.limit}
        total={data?.total}
        onPageChange={setPage}
      />

      {data && <p className="text-sm text-muted">Tổng {data.total} sản phẩm.</p>}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.item.itemName}` : 'Thêm sản phẩm'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="product-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Tên sản phẩm"
            required
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="SKU"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              hint="Mã trên vỏ hộp — không được trùng."
            />
            <Input
              label="Đơn vị"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="hộp, gói, chai…"
            />
            <Input
              label="Thương hiệu"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Select
              label="Danh mục"
              value={form.categoryId}
              onChange={(value) => setForm({ ...form, categoryId: value })}
              options={[{ value: '', label: '— Chưa phân loại —' }, ...categoryOptions]}
            />
            <Input
              label="Giá bán (đồng)"
              type="number"
              min={0}
              required
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
            <Input
              label="Giá vốn (đồng)"
              type="number"
              min={0}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              error={sellingBelowCost ? 'Giá vốn đang cao hơn giá bán — sẽ bán lỗ.' : undefined}
            />
            <Input
              label="Tồn kho tối thiểu"
              type="number"
              min={0}
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
              hint="Dưới mức này sẽ được cảnh báo nhập hàng."
            />
          </div>
          <Textarea
            label="Mô tả"
            rows={3}
            value={form.describe}
            onChange={(e) => setForm({ ...form, describe: e.target.value })}
          />
          {editing && (
            <p className="text-sm text-muted">
              Mã nội bộ <span className="font-mono">{editing.item.code}</span> do hệ thống sinh và
              không đổi được.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
