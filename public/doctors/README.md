# Ảnh bác sĩ

`doctor-1.svg` … `doctor-6.svg` là **ảnh minh hoạ tạm** (hình vẽ phẳng, không phải người
thật). Seed dữ liệu gán chúng vào `Doctor.avatarUrl` để giao diện không phải rơi về
avatar chữ cái.

## Thay bằng ảnh thật

1. Đặt ảnh chân dung vào thư mục này, ví dụ `bs-le-van-an.jpg` (nên là ảnh vuông,
   tối thiểu 400×400).
2. Upload ảnh lên Cloudinary trong thư mục `vetcare/web/doctors` và cập nhật `avatarUrl`
   bằng URL HTTPS do Cloudinary trả về —
   qua màn hình quản trị bác sĩ, hoặc sửa `doctorSeeds` trong
   `veterinary-clinic-backend/src/shared/database/seeds/run-seed.ts` rồi seed lại.

Chỉ dùng ảnh mà phòng khám có quyền sử dụng và bác sĩ đã đồng ý — không lấy ảnh người
thật trên mạng để làm ảnh bác sĩ minh hoạ.
