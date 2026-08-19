import { Link } from 'react-router-dom';
import { Alert, Icon } from '@/components/basic';

const EXAMPLES = [
  'Chó của tôi bị nôn và bỏ ăn hai ngày nay, có nghiêm trọng không?',
  'Mèo rụng lông nhiều và gãi liên tục, tôi nên làm gì trước khi đưa đi khám?',
  'Bé nhà tôi 3 tháng tuổi, cần tiêm những mũi gì?',
];

/**
 * Giới thiệu trợ lý AI trên trang chủ.
 *
 * Định vị rất rõ và cố ý: **hỗ trợ tham khảo, không thay thế bác sĩ**. Câu miễn trừ
 * không giấu ở chân trang mà đặt ngay cạnh lời mời dùng thử - người đọc phải gặp nó
 * cùng lúc với ý định bấm vào.
 *
 * Không dùng gradient tím, không icon robot, không gọi nó là "bác sĩ AI". Đây là công
 * cụ sàng lọc triệu chứng của một phòng khám, và giao diện phải nói đúng điều đó.
 */
export function AiConsultSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Chưa chắc có cần đi khám không?
          </h2>
          <p className="mt-2 text-muted">
            Mô tả dấu hiệu bất thường của bé với trợ lý AI. Trợ lý giúp bạn hiểu tình trạng ban đầu
            và cho biết trường hợp nào nên đưa tới phòng khám ngay.
          </p>

          <Alert tone="warning" className="mt-5">
            Trợ lý AI chỉ cung cấp thông tin tham khảo. Nó không chẩn đoán bệnh và không thay thế
            việc thăm khám trực tiếp của bác sĩ thú y.
          </Alert>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/chat"
              className="inline-flex min-h-touch items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Icon name="sparkles" className="h-4 w-4" />
              Trò chuyện với trợ lý
            </Link>
            <Link
              to="/booking"
              className="inline-flex min-h-touch items-center rounded-lg border border-border px-5 font-semibold text-foreground transition-colors hover:bg-surface-muted"
            >
              Đặt lịch với bác sĩ
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-foreground">Ví dụ câu hỏi</p>
          <ul className="mt-3 space-y-2.5">
            {EXAMPLES.map((example) => (
              <li
                key={example}
                className="rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm text-foreground"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
