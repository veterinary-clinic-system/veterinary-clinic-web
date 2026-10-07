import { AiAccuracyReport, ExamSummaryReport, InventoryReport, RevenueSummaryReport } from '@/api/reports.api';
import { Skeleton, StatTile } from '@/components/basic';
import { formatCurrency } from '@/utils/format';

export interface ReportStatsHeaderProps {
  summary?: RevenueSummaryReport;
  exams?: ExamSummaryReport;
  inventory?: InventoryReport;
  ai?: AiAccuracyReport;
  loading?: boolean;
}

export function ReportStatsHeader({ summary, exams, inventory, ai, loading }: ReportStatsHeaderProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const stockAlertCount = (inventory?.lowStock ?? 0) + (inventory?.outOfStock ?? 0);
  const aiRate = ai ? Math.round((ai.acceptanceRate || 0) * 100) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Doanh thu thuần"
        value={summary ? formatCurrency(summary.totalRevenue) : '0 ₫'}
        hint={summary ? `Đã thu: ${formatCurrency(summary.totalPaid)}` : undefined}
        icon="receipt"
        tone="success"
      />

      <StatTile
        label="Đã hoàn tiền"
        value={summary ? formatCurrency(summary.totalRefunded) : '0 ₫'}
        hint={summary ? `${summary.invoiceCount} hóa đơn phát sinh` : undefined}
        icon="history"
        tone="default"
      />

      <StatTile
        label="Còn phải thu"
        value={summary ? formatCurrency(summary.totalUnpaid) : '0 ₫'}
        hint={
          summary && summary.unpaidInvoiceCount > 0
            ? `${summary.unpaidInvoiceCount} hóa đơn chưa thu đủ`
            : 'Đã thu đủ'
        }
        icon="alert"
        tone={summary && summary.totalUnpaid > 0 ? 'warning' : 'default'}
      />

      <StatTile
        label="Lượt khám xong"
        value={exams ? exams.completed.toLocaleString('vi-VN') : '0'}
        hint={exams ? `Vắng mặt: ${Math.round(exams.noShowRate * 100)}%` : undefined}
        icon="stethoscope"
        tone="default"
      />

      <StatTile
        label="Cảnh báo kho"
        value={inventory ? stockAlertCount.toLocaleString('vi-VN') : '0'}
        hint={
          inventory
            ? `${inventory.expiringSoon} mục sắp hết hạn`
            : undefined
        }
        icon="warehouse"
        tone={stockAlertCount > 0 ? 'danger' : 'default'}
      />

      <StatTile
        label="Đồng thuận AI"
        value={aiRate !== null ? `${aiRate}%` : '---'}
        hint={ai ? `${ai.accepted}/${ai.totalEvaluated} lượt giữ nguyên` : undefined}
        icon="sparkles"
        tone={aiRate !== null && aiRate >= 80 ? 'success' : 'default'}
      />
    </div>
  );
}
