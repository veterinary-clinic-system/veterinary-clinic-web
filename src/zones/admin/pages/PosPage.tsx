import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/api/branches.api';
import { posApi } from '@/api/pos.api';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Modal,
  Select,
  SkeletonCards,
  useToast,
} from '@/components/basic';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { CartStatus, PaymentMethod, PosProduct } from '@/types/models';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { PAYMENT_METHOD_LABEL_VI } from '@/utils/labels';

/**
 * Màn hình bán hàng tại quầy — bố cục theo mockup SRS mục 12.5: ô tìm sản phẩm trên
 * cùng, danh sách sản phẩm bên trái, giỏ hàng + tổng tiền + nút THANH TOÁN bên phải.
 *
 * BÀN PHÍM LÀ ĐƯỜNG NHẬP LIỆU CHÍNH, chuột chỉ là dự phòng — quầy bán hàng cần nhanh:
 *   - Con trỏ tự về ô tìm kiếm sau mọi thao tác; máy quét mã vạch gõ SKU rồi Enter.
 *   - Enter trong ô tìm: đúng một kết quả thì thêm luôn vào giỏ (đường của máy quét).
 *   - Ô số lượng trong giỏ sửa trực tiếp bằng số, Enter để xác nhận.
 *   - F9 mở modal thanh toán, Esc đóng.
 *
 * Giỏ nằm ở server: mở lại trang trên máy khác vẫn thấy giỏ đang dở của quầy (FR-19).
 */
export function PosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState(user?.branchId ?? '');
  const [cartId, setCartId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  // Chi nhánh mặc định: chi nhánh của tài khoản; ADMIN không gắn chi nhánh thì lấy cái
  // đầu danh sách để màn hình dùng được ngay thay vi bắt chọn trước khi thấy gì.
  useEffect(() => {
    if (!branchId && branchesQuery.data?.length) {
      setBranchId(branchesQuery.data[0].id);
    }
  }, [branchId, branchesQuery.data]);

  const productsQuery = useQuery({
    queryKey: ['pos-products', branchId, debouncedSearch],
    queryFn: () => posApi.products({ branchId, search: debouncedSearch || undefined, limit: 50 }),
    enabled: Boolean(branchId),
    placeholderData: (prev) => prev,
  });

  // Giỏ đang mở của chi nhánh — lấy lại khi đổi máy hoặc F5 giữa chừng.
  const openCartsQuery = useQuery({
    queryKey: ['pos-open-carts', branchId],
    queryFn: () => posApi.carts({ branchId, status: CartStatus.OPEN, limit: 1 }),
    enabled: Boolean(branchId) && !cartId,
  });

  useEffect(() => {
    if (!cartId && openCartsQuery.data?.data.length) {
      setCartId(openCartsQuery.data.data[0].id);
    }
  }, [cartId, openCartsQuery.data]);

  const cartQuery = useQuery({
    queryKey: ['pos-cart', cartId],
    queryFn: () => posApi.getCart(cartId!),
    enabled: Boolean(cartId),
  });

  const refocus = () => searchRef.current?.focus();

  const onCartChanged = (view: { cart: { id: string } }) => {
    queryClient.setQueryData(['pos-cart', view.cart.id], view);
    queryClient.invalidateQueries({ queryKey: ['pos-products', branchId] });
    refocus();
  };

  const failed = (error: unknown) => {
    toast.show(getErrorMessage(error), 'error');
    refocus();
  };

  const createCart = useMutation({
    mutationFn: () => posApi.createCart({ branchId }),
    onSuccess: (view) => {
      setCartId(view.cart.id);
      onCartChanged(view);
    },
    onError: failed,
  });

  const addItem = useMutation({
    mutationFn: async (itemId: string) => {
      const id = cartId ?? (await posApi.createCart({ branchId })).cart.id;
      setCartId(id);
      return posApi.addItem(id, { itemId, quantity: 1 });
    },
    onSuccess: (view) => {
      onCartChanged(view);
      setSearch('');
    },
    onError: failed,
  });

  /**
   * Đường của MÁY QUÉT MÃ VẠCH: gõ SKU rồi Enter.
   *
   * Hỏi lại API bằng đúng chuỗi vừa gõ thay vì đọc `productsQuery.data`. Máy quét gõ cả
   * chuỗi trong vài chục mili-giây rồi Enter ngay, nhanh hơn hẳn 250ms debounce của ô
   * tìm — đọc kết quả đang có trong tay là đọc kết quả của lần gõ TRƯỚC, và cú quét sẽ
   * lặng lẽ không làm gì.
   */
  const scan = useMutation({
    mutationFn: (term: string) => posApi.products({ branchId, search: term, limit: 2 }),
    onSuccess: (results) => {
      if (results.length === 0) {
        toast.show('Không tìm thấy mặt hàng nào khớp mã vừa quét', 'error');
        return;
      }
      if (results.length > 1) {
        toast.show('Mã khớp nhiều mặt hàng — chọn trong danh sách bên trái', 'info');
        return;
      }
      if (results[0].availableQuantity <= 0) {
        toast.show(`"${results[0].itemName}" đã hết hàng`, 'error');
        return;
      }
      addItem.mutate(results[0].itemId);
    },
    onError: failed,
  });

  const setQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      quantity <= 0
        ? posApi.removeItem(cartId!, itemId)
        : posApi.setQuantity(cartId!, itemId, quantity),
    onSuccess: onCartChanged,
    onError: failed,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => posApi.removeItem(cartId!, itemId),
    onSuccess: onCartChanged,
    onError: failed,
  });

  const setDiscount = useMutation({
    mutationFn: (amount: number) => posApi.setDiscount(cartId!, { amount }),
    onSuccess: onCartChanged,
    onError: failed,
  });

  const view = cartQuery.data;
  const lines = view?.cart.items ?? [];
  const stockByItem = useMemo(
    () => new Map((view?.stockCheck ?? []).map((s) => [s.itemId, s])),
    [view],
  );

  // F9 mở thanh toán — phím tắt quen thuộc của mọi phần mềm bán hàng ở VN.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F9' && lines.length > 0) {
        e.preventDefault();
        setPayOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lines.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bán hàng tại quầy</h1>
        <div className="w-56">
          <Select
            value={branchId}
            onChange={(value) => {
              setBranchId(value);
              setCartId(null);
            }}
            options={(branchesQuery.data ?? []).map((b) => ({ value: b.id, label: b.branchName }))}
            placeholder="Chọn chi nhánh"
          />
        </div>
      </div>

      {/* Ô tìm sản phẩm trên cùng — mockup SRS 12.5 */}
      <input
        ref={searchRef}
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const term = search.trim();
          if (term) scan.mutate(term);
        }}
        placeholder="Tìm theo tên, mã hàng hoặc quét mã vạch (SKU) rồi Enter…"
        className="w-full rounded border border-border bg-surface px-4 py-3 text-base"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        <ProductGrid
          products={productsQuery.data ?? []}
          loading={productsQuery.isLoading}
          error={productsQuery.isError}
          onRetry={() => void productsQuery.refetch()}
          onPick={(product) => addItem.mutate(product.itemId)}
        />

        <aside className="flex h-fit flex-col gap-3 rounded border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Giỏ hàng</h2>
            {cartId && (
              <button
                type="button"
                onClick={() => {
                  posApi.abandon(cartId).catch(() => undefined);
                  setCartId(null);
                  refocus();
                }}
                className="text-xs text-destructive hover:underline"
              >
                Hủy giỏ
              </button>
            )}
          </div>

          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Chưa có mặt hàng nào. Tìm và chọn sản phẩm ở bên trái.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {lines.map((line) => {
                const stock = stockByItem.get(line.itemId);
                return (
                  <li key={line.id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{line.item.itemName}</div>
                      <div className="text-xs text-muted">
                        {formatCurrency(line.unitPrice)}
                        {stock?.insufficientStock && (
                          <span className="ml-2 text-destructive">
                            chỉ còn {stock.availableQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      defaultValue={line.quantity}
                      key={`${line.id}-${line.quantity}`}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        setQuantity.mutate({
                          itemId: line.itemId,
                          quantity: Number((e.target as HTMLInputElement).value),
                        });
                      }}
                      onBlur={(e) => {
                        const next = Number(e.target.value);
                        if (next !== line.quantity) {
                          setQuantity.mutate({ itemId: line.itemId, quantity: next });
                        }
                      }}
                      className="w-16 rounded border border-border bg-surface px-2 py-1 text-right text-sm tabular-nums"
                      aria-label={`Số lượng ${line.item.itemName}`}
                    />
                    <span className="w-24 text-right text-sm tabular-nums">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(line.itemId)}
                      className="px-1 text-muted hover:text-destructive"
                      aria-label={`Xóa ${line.item.itemName}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <Row label="Tạm tính" value={formatCurrency(view?.subtotal ?? 0)} />
            <div className="flex items-center justify-between">
              <dt className="text-muted">Giảm giá</dt>
              <dd>
                <input
                  type="number"
                  min={0}
                  defaultValue={view?.discountAmount ?? 0}
                  key={`discount-${cartId}-${view?.discountAmount ?? 0}`}
                  disabled={!cartId || lines.length === 0}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    setDiscount.mutate(Number((e.target as HTMLInputElement).value));
                  }}
                  onBlur={(e) => {
                    const next = Number(e.target.value);
                    if (next !== (view?.discountAmount ?? 0)) setDiscount.mutate(next);
                  }}
                  className="w-28 rounded border border-border bg-surface px-2 py-1 text-right text-sm tabular-nums"
                  aria-label="Giảm giá"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Tổng cộng</dt>
              <dd className="tabular-nums">{formatCurrency(view?.totalAmount ?? 0)}</dd>
            </div>
          </dl>

          <Button
            size="lg"
            fullWidth
            disabled={lines.length === 0}
            onClick={() => setPayOpen(true)}
          >
            THANH TOÁN (F9)
          </Button>
          {!cartId && (
            <Button
              variant="secondary"
              fullWidth
              loading={createCart.isPending}
              onClick={() => createCart.mutate()}
              disabled={!branchId}
            >
              Mở giỏ mới
            </Button>
          )}
        </aside>
      </div>

      {payOpen && cartId && view && (
        <PaymentModal
          cartId={cartId}
          totalAmount={view.totalAmount}
          onClose={() => {
            setPayOpen(false);
            refocus();
          }}
          onPaid={() => {
            setPayOpen(false);
            setCartId(null);
            queryClient.invalidateQueries({ queryKey: ['pos-products', branchId] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            refocus();
          }}
        />
      )}
    </div>
  );
}

/**
 * Lưới sản phẩm bên trái.
 *
 * HẾT HÀNG HIỆN NGAY TRÊN LƯỚI, không đợi tới lúc thanh toán mới báo: ô bị mờ, có nhãn
 * "Hết hàng" và không bấm được. Số hiện ở đây là số **bán được** (backend đã loại lô hết
 * hạn), nên nó khớp với con số mà bước thanh toán sẽ kiểm.
 */
function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  onPick,
}: {
  products: PosProduct[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onPick: (product: PosProduct) => void;
}) {
  if (loading) {
    return <SkeletonCards count={6} label="Đang tải danh sách sản phẩm" />;
  }
  /*
    Nhánh này phải đứng TRƯỚC nhánh rỗng. Câu rỗng bên dưới bảo thu ngân đi kiểm tra
    xem mặt hàng có tồn tại chi nhánh này không - một lời khuyên đúng khi kho thật sự
    không có hàng, và là một cuộc điều tra vô ích khi thứ hỏng là mạng. Khách đang
    đứng ở quầy đợi.
  */
  if (error) {
    return (
      <ErrorState
        title="Không tải được danh sách mặt hàng"
        description="Máy chủ không trả lời. Chưa thể kết luận chi nhánh có mặt hàng này hay không."
        onRetry={onRetry}
      />
    );
  }
  if (products.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy mặt hàng nào"
        description="Thử từ khoá khác, hoặc kiểm tra xem mặt hàng đã có tồn tại chi nhánh này chưa."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const outOfStock = product.availableQuantity <= 0;
        return (
          <button
            key={product.itemId}
            type="button"
            disabled={outOfStock}
            onClick={() => onPick(product)}
            className={`flex flex-col gap-1 rounded border border-border bg-surface p-3 text-left transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border`}
          >
            <span className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">
              {product.itemName}
            </span>
            <span className="font-mono text-[11px] text-muted">{product.sku ?? product.code}</span>
            <span className="text-sm font-semibold">{formatCurrency(product.unitPrice)}</span>
            {outOfStock ? (
              <Badge variant="destructive">Hết hàng</Badge>
            ) : (
              <span className="text-xs text-muted">
                Còn {product.availableQuantity}
                {product.unit ? ` ${product.unit}` : ''}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Modal thanh toán: chọn phương thức, xác nhận, rồi mở hoá đơn để in. */
function PaymentModal({
  cartId,
  totalAmount,
  onClose,
  onPaid,
}: {
  cartId: string;
  totalAmount: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [referenceCode, setReferenceCode] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceCode, setInvoiceCode] = useState('');

  const checkout = useMutation({
    mutationFn: () =>
      posApi.checkout(cartId, {
        paymentMethod,
        referenceCode: referenceCode.trim() || undefined,
      }),
    onSuccess: (result) => {
      setInvoiceId(result.invoice.id);
      setInvoiceCode(result.invoice.invoiceCode);
      toast.show(`Đã thanh toán — hóa đơn ${result.invoice.invoiceCode}`, 'success');
    },
    onError: (error) => toast.show(getErrorMessage(error), 'error'),
  });

  // Sau khi thanh toán xong, modal đổi thành phiếu xác nhận có liên kết in hoá đơn.
  if (invoiceId) {
    return (
      <Modal
        open
        onClose={onPaid}
        title="Thanh toán thành công"
        footer={
          <div className="flex justify-end gap-2">
            <Link
              to={`/staff/billing/${invoiceId}`}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-muted"
            >
              Mở hóa đơn để in
            </Link>
            <Button onClick={onPaid}>Bán tiếp</Button>
          </div>
        }
      >
        <p className="text-sm">
          Hóa đơn <strong>{invoiceCode}</strong> — {formatCurrency(totalAmount)}
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Thanh toán ${formatCurrency(totalAmount)}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={checkout.isPending} onClick={() => checkout.mutate()}>
            Xác nhận
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Select
          label="Phương thức thanh toán"
          value={paymentMethod}
          onChange={(value) => setPaymentMethod(value as PaymentMethod)}
          options={Object.values(PaymentMethod).map((m) => ({
            value: m,
            label: PAYMENT_METHOD_LABEL_VI[m],
          }))}
        />
        {paymentMethod !== PaymentMethod.CASH && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Mã giao dịch (để đối soát)</span>
            <input
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="rounded border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
