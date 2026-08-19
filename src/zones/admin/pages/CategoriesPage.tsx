import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api/products.api';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  SkeletonText,
  useToast,
} from '@/components/basic';
import { QueryErrorState } from '@/components/QueryErrorState';
import { Category, ItemType } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';

/** Ba loại có danh mục theo SRS: FR-14 dịch vụ, FR-15 thuốc, FR-16 sản phẩm. */
const ITEM_TYPE_OPTIONS = [
  { value: ItemType.PRODUCT, label: 'Sản phẩm' },
  { value: ItemType.MEDICATION, label: 'Thuốc' },
  { value: ItemType.SERVICE, label: 'Dịch vụ' },
];

interface CategoryFormState {
  categoryName: string;
  code: string;
  parentId: string;
}

const EMPTY_FORM: CategoryFormState = { categoryName: '', code: '', parentId: '' };

/**
 * SRS FR-16 — cây danh mục hàng hoá.
 *
 * Hiển thị đúng dạng cây backend trả về thay vì bảng phẳng: quan hệ cha–con là toàn bộ
 * giá trị của màn hình này, một bảng có cột "danh mục cha" bắt người dùng tự ghép lại
 * trong đầu.
 */
export function CategoriesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [itemType, setItemType] = useState<string>(ItemType.PRODUCT);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);

  const treeQuery = useQuery({
    queryKey: ['categories', itemType, 'all'],
    queryFn: () => categoriesApi.tree({ itemType, includeInactive: true }),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return categoriesApi.update(editing.id, {
          categoryName: form.categoryName,
          code: form.code,
          parentId: form.parentId || null,
        });
      }
      return categoriesApi.create({
        categoryName: form.categoryName,
        code: form.code,
        itemType,
        parentId: form.parentId || undefined,
      });
    },
    onSuccess: () => {
      toast.show(editing ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.', 'success');
      closeForm();
      invalidate();
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.show('Đã xoá danh mục.', 'success');
      invalidate();
    },
    // Backend trả 409 kèm lý do rõ ("còn N mặt hàng…") - hiện nguyên văn.
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (category: Category) =>
      categoriesApi.update(category.id, { active: !category.active }),
    onSuccess: () => invalidate(),
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  function openCreate(parentId = '') {
    setEditing(null);
    setForm({ ...EMPTY_FORM, parentId });
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      categoryName: category.categoryName,
      code: category.code,
      parentId: category.parentId ?? '',
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

  // Danh mục cha chọn được: mọi nút TRỪ chính nó và các hậu duệ của nó (backend cũng
  // chặn, nhưng không nên mời người dùng bấm vào thứ chắc chắn sẽ lỗi).
  const parentOptions = [
    { value: '', label: '— Danh mục gốc —' },
    ...flattenExcluding(treeQuery.data ?? [], editing?.id),
  ];

  const tree = treeQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Danh mục hàng hoá</h1>
        <Button onClick={() => openCreate()}>Thêm danh mục gốc</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <Select
          label="Loại"
          value={itemType}
          onChange={setItemType}
          options={ITEM_TYPE_OPTIONS}
          hint="Mỗi loại có cây danh mục riêng."
        />
      </div>

      <div className="rounded border border-border bg-surface p-4">
        {treeQuery.isLoading && <SkeletonText lines={5} />}
        {treeQuery.isError && (
          <QueryErrorState
            error={treeQuery.error}
            title="Không tải được cây danh mục"
            onRetry={() => void treeQuery.refetch()}
          />
        )}
        {!treeQuery.isLoading && !treeQuery.isError && tree.length === 0 && (
          <EmptyState
            title="Chưa có danh mục nào cho loại này"
            description="Thêm danh mục gốc ở biểu mẫu bên trên để bắt đầu phân nhóm hàng hoá."
          />
        )}
        <ul className="flex flex-col gap-1">
          {tree.map((node) => (
            <CategoryNode
              key={node.id}
              node={node}
              depth={0}
              onAddChild={openCreate}
              onEdit={openEdit}
              onRemove={(id) => removeMutation.mutate(id)}
              onToggleActive={(category) => toggleActiveMutation.mutate(category)}
            />
          ))}
        </ul>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Cập nhật: ${editing.categoryName}` : 'Thêm danh mục'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit" form="category-form" loading={saveMutation.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Tên danh mục"
            required
            value={form.categoryName}
            onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
          />
          <Input
            label="Mã danh mục"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            hint="Không được trùng với danh mục khác."
          />
          <Select
            label="Danh mục cha"
            value={form.parentId}
            onChange={(value) => setForm({ ...form, parentId: value })}
            options={parentOptions}
          />
          {!editing && (
            <p className="text-sm text-muted">
              Danh mục sẽ thuộc loại{' '}
              <strong>{ITEM_TYPE_OPTIONS.find((o) => o.value === itemType)?.label}</strong>. Loại
              không sửa được sau khi tạo.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}

function CategoryNode({
  node,
  depth,
  onAddChild,
  onEdit,
  onRemove,
  onToggleActive,
}: {
  node: Category;
  depth: number;
  onAddChild: (parentId: string) => void;
  onEdit: (category: Category) => void;
  onRemove: (id: string) => void;
  onToggleActive: (category: Category) => void;
}) {
  return (
    <li>
      <div
        className="flex flex-wrap items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-muted"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <span className="font-medium">{node.categoryName}</span>
        <span className="font-mono text-xs text-muted">{node.code}</span>
        {!node.active && <Badge variant="destructive">Đã ẩn</Badge>}
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onAddChild(node.id)}>
            + Con
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(node)}>
            Sửa
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggleActive(node)}>
            {node.active ? 'Ẩn' : 'Hiện'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(node.id)}>
            Xoá
          </Button>
        </div>
      </div>
      {(node.children ?? []).length > 0 && (
        <ul className="flex flex-col gap-1">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onRemove={onRemove}
              onToggleActive={onToggleActive}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Làm phẳng cây, bỏ nhánh gốc ở `excludeId` (chính nó + mọi hậu duệ). */
function flattenExcluding(
  nodes: Category[],
  excludeId: string | undefined,
  depth = 0,
): { value: string; label: string }[] {
  return nodes.flatMap((node) => {
    if (excludeId && node.id === excludeId) return [];
    return [
      { value: node.id, label: `${'  '.repeat(depth)}${depth > 0 ? '└ ' : ''}${node.categoryName}` },
      ...flattenExcluding(node.children ?? [], excludeId, depth + 1),
    ];
  });
}
