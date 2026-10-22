// Nội dung chính sách quyền riêng tư - dùng chung cho trang /privacy (web) và màn hình
// "Chính sách quyền riêng tư" của app VetCare. App chép file này sang
// veterinary-clinic-mobile/src/legal/privacy-policy.ts: sửa ở đây thì chép lại bên đó.
// URL công khai của trang /privacy là đường dẫn khai báo trên Google Play.

export const PRIVACY_POLICY_UPDATED_AT = '22/10/2026';

export interface PrivacySection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const PRIVACY_POLICY_INTRO =
  'Chính sách này giải thích phòng khám thú y VetCare thu thập những dữ liệu nào khi bạn dùng ' +
  'trang web và app VetCare, dùng chúng vào việc gì, chia sẻ với ai, và bạn có những quyền gì ' +
  'đối với dữ liệu của mình.';

export const PRIVACY_POLICY_SECTIONS: PrivacySection[] = [
  {
    title: '1. Dữ liệu chúng tôi thu thập',
    bullets: [
      'Thông tin tài khoản: họ tên, số điện thoại (dùng để đăng nhập), email, ngày sinh, địa chỉ và ảnh đại diện nếu bạn cung cấp.',
      'Thông tin thú cưng: tên, loài, giống, cân nặng, ảnh, hồ sơ khám, chẩn đoán, đơn thuốc, kết quả xét nghiệm, lịch tiêm.',
      'Lịch hẹn và thanh toán: thời gian, chi nhánh, dịch vụ, bác sĩ, hoá đơn và trạng thái thanh toán. Chúng tôi không lưu số thẻ ngân hàng.',
      'Tin nhắn và cuộc gọi với bác sĩ: nội dung tin nhắn, ảnh bạn gửi, thời điểm và thời lượng cuộc gọi. Nội dung cuộc gọi thoại/video không được ghi âm hay ghi hình.',
      'Trò chuyện với trợ lý AI: nội dung bạn nhập và ảnh bạn gửi để được đánh giá sơ bộ hoặc đặt lịch.',
      'Thiết bị: mã nhận thông báo đẩy của app (push token) và hệ điều hành, để gửi nhắc lịch và báo tin nhắn mới.',
    ],
  },
  {
    title: '2. Quyền truy cập trên điện thoại',
    bullets: [
      'Micro và camera: chỉ dùng khi bạn gọi thoại/video với bác sĩ.',
      'Thư viện ảnh và camera: chỉ dùng khi bạn chọn ảnh để gửi cho bác sĩ hoặc trợ lý AI.',
      'Thông báo: để nhắc lịch hẹn, lịch tiêm, báo tin nhắn mới và cuộc gọi đến.',
      'Bạn có thể tắt từng quyền trong phần Cài đặt của điện thoại; tính năng tương ứng sẽ ngừng hoạt động nhưng các phần khác vẫn dùng được.',
    ],
  },
  {
    title: '3. Chúng tôi dùng dữ liệu để làm gì',
    bullets: [
      'Khám chữa bệnh, theo dõi sức khoẻ và lịch tiêm của thú cưng.',
      'Đặt lịch, xác nhận và nhắc lịch hẹn; lập hoá đơn và nhận thanh toán.',
      'Cho bạn trao đổi với bác sĩ qua tin nhắn và cuộc gọi.',
      'Gửi thông báo về lịch hẹn, lịch tiêm và mã khôi phục mật khẩu.',
      'Bảo vệ tài khoản (phát hiện đăng nhập bất thường) và lưu nhật ký thao tác theo quy định.',
      'Chúng tôi không bán dữ liệu của bạn và không dùng dữ liệu để quảng cáo.',
    ],
  },
  {
    title: '4. Bên thứ ba cùng xử lý dữ liệu',
    paragraphs: [
      'Để vận hành dịch vụ, một phần dữ liệu được chuyển cho các nhà cung cấp sau, chỉ trong phạm vi cần thiết:',
    ],
    bullets: [
      'Zalo (Zalo Notification Service) và dịch vụ email: gửi tin xác nhận, nhắc lịch và mã khôi phục mật khẩu tới số điện thoại/email của bạn.',
      'Expo và Google Firebase Cloud Messaging: chuyển thông báo đẩy tới app trên điện thoại.',
      'Cloudinary: lưu ảnh thú cưng, ảnh đại diện và ảnh gửi trong tin nhắn.',
      'Nhà cung cấp mô hình AI: xử lý nội dung bạn gửi cho trợ lý AI để trả lời. Không gửi kèm số điện thoại hay mật khẩu của bạn.',
      'SePay: đối soát chuyển khoản khi bạn thanh toán bằng mã QR.',
    ],
  },
  {
    title: '5. Lưu trữ và xoá dữ liệu',
    paragraphs: [
      'Dữ liệu được lưu trong suốt thời gian bạn dùng tài khoản. Hồ sơ khám, đơn thuốc và hoá đơn của thú cưng được giữ lại theo quy định về lưu trữ hồ sơ thú y và sổ sách kế toán, kể cả sau khi bạn xoá tài khoản.',
      'Khi bạn xoá tài khoản, chúng tôi xoá ngay họ tên, số điện thoại, email, ngày sinh, địa chỉ, mật khẩu, các thiết bị nhận thông báo và hộp thông báo của bạn; mọi phiên đăng nhập bị thu hồi. Hồ sơ khám còn lại không còn gắn với thông tin nhận dạng của bạn. Số điện thoại có thể được dùng để đăng ký lại từ đầu.',
    ],
  },
  {
    title: '6. Quyền của bạn',
    bullets: [
      'Xem dữ liệu: toàn bộ hồ sơ thú cưng, lịch hẹn, tin nhắn và hoá đơn hiển thị trong app và trang web.',
      'Sửa thông tin: vào Tài khoản → Thông tin cá nhân.',
      'Xoá tài khoản: vào Tài khoản → Xoá tài khoản (trên app hoặc trang web, mục "Tài khoản của tôi"). Nếu không đăng nhập được, hãy liên hệ lễ tân bất kỳ chi nhánh nào để được hỗ trợ xoá.',
      'Rút lại sự đồng ý nhận thông báo: tắt thông báo của app trong Cài đặt điện thoại.',
    ],
  },
  {
    title: '7. Bảo mật',
    paragraphs: [
      'Mật khẩu được mã hoá một chiều; mọi kết nối giữa app, trang web và máy chủ được mã hoá (HTTPS). Chỉ nhân viên có vai trò phù hợp mới xem được hồ sơ khám, và mọi thao tác trên dữ liệu đều được ghi nhật ký.',
    ],
  },
  {
    title: '8. Trẻ em',
    paragraphs: [
      'Dịch vụ dành cho người từ 16 tuổi trở lên. Chúng tôi không cố ý thu thập dữ liệu của trẻ em.',
    ],
  },
  {
    title: '9. Thay đổi và liên hệ',
    paragraphs: [
      'Khi chính sách thay đổi, chúng tôi cập nhật ngày hiệu lực ở đầu trang và thông báo trong app nếu thay đổi quan trọng.',
      'Mọi câu hỏi về dữ liệu cá nhân, vui lòng liên hệ lễ tân qua số điện thoại của các chi nhánh trên trang Chi nhánh.',
    ],
  },
];
