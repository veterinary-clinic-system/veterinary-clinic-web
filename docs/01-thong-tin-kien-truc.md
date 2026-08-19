# Kiến trúc thông tin, điều hướng và luồng người dùng

> Tài liệu phân tích **trước khi code**. Nguồn sự thật cho mọi quyết định giao diện của
> `veterinary-clinic-web`. Khi màn hình và tài liệu lệch nhau, sửa tài liệu trước rồi
> mới sửa màn hình.

---

## 1. Bản đồ tổng thể

Hệ thống có **2 khung hiển thị**, **4 ranh giới code**, **42 màn hình**, **7 vai trò
đăng nhập** và **1 nhóm khách vãng lai**.

```
                        DESIGN SYSTEM
                             |
              +--------------+--------------+
              |                             |
        PublicLayout                  StaffLayout
     header - nav - footer      sidebar - topbar - breadcrumb
              |                             |
       +------+------+               +------+------+
       |             |               |             |
     public        owner          clinical       admin
    8 màn hình   4 màn hình     11 màn hình   19 màn hình
      GUEST       PET_OWNER    DOCTOR         ADMIN
                               RECEPTIONIST   MANAGER
                                              PHARMACIST
                                              STAFF
```

**Quy tắc gốc: Zone khác Layout.** Zone là ranh giới *gói JavaScript* (`vite.config.ts`
gom `src/zones/<tên>/` thành một chunk), không phải ranh giới thị giác và cũng không
phải ranh giới URL. `clinical` và `admin` cùng nằm dưới `/staff`, cùng dùng
`StaffLayout`, cùng một ngôn ngữ thị giác. Cái khác nhau giữa chúng là *kiến trúc thông
tin*, *mật độ*, *workflow* và *quyền* — không phải màu sắc, bo góc hay kiểu chữ.

Hệ quả trực tiếp: **không có "Admin Dashboard" và "Doctor Dashboard" là hai hệ thống
thị giác khác nhau.** Có một hệ thống, đặt hai câu hỏi khác nhau cho hai loại công việc
khác nhau.

---

## 2. Kiến trúc thông tin theo zone

### 2.1 Zone `public` — 8 màn hình · GUEST

Người dùng chưa có tài khoản, chưa có ngữ cảnh, và đang cân nhắc có nên tin phòng khám
này hay không. Mục tiêu duy nhất của zone: **đưa họ tới `/booking` với đủ thông tin để
tự tin bấm nút.**

| # | Màn hình | URL | Câu hỏi màn hình trả lời |
|---|---|---|---|
| 1 | Trang chủ | `/` | Phòng khám này làm gì, có đáng tin không, đặt lịch ở đâu? |
| 2 | Dịch vụ | `/services` | Có dịch vụ tôi cần không, bao nhiêu tiền, mất bao lâu? |
| 3 | Bác sĩ | `/doctors` | Ai sẽ khám cho bé nhà tôi? |
| 4 | Chi nhánh | `/branches` | Chỗ nào gần tôi, mấy giờ mở cửa? |
| 5 | Đặt lịch | `/booking` | (luồng 8 bước — mục 4.1) |
| 6 | Tư vấn AI | `/chat` | Tình trạng này có cần đi khám gấp không? |
| 7 | Đăng nhập | `/login` | — |
| 8 | Đăng ký | `/register` | — |

Thứ tự ưu tiên nội dung của zone này là **dịch vụ, bác sĩ, chi nhánh**, vì đó đúng thứ
tự câu hỏi trong đầu người đang tìm phòng khám. Không phải "về chúng tôi, tầm nhìn, sứ
mệnh".

### 2.2 Zone `owner` — 4 màn hình · PET_OWNER

Nằm **trong `PublicLayout`**. Chủ nuôi đi qua lại giữa trang giới thiệu và khu của mình
liên tục (xem dịch vụ, rồi đặt lịch cho bé đã có hồ sơ); đổi khung giữa chừng làm họ
tưởng đã rời khỏi trang.

| # | Màn hình | URL | Vai trò trong luồng |
|---|---|---|---|
| 9 | Thú cưng của tôi | `/my/pets` | Trang chủ thật sự của chủ nuôi |
| 10 | Hồ sơ thú cưng | `/my/pets/:id` | Tất cả những gì hệ thống biết về một bé |
| 11 | Lịch hẹn của tôi | `/my/appointments` | Sắp tới / đã xong / đã huỷ |
| 12 | Chi tiết lịch hẹn | `/my/appointments/:id` | Trạng thái và hành động theo trạng thái |

**Hồ sơ thú cưng có BỐN tab, không phải sáu.** Đặc tả ban đầu liệt kê thêm "Tiêm phòng"
và "Đơn thuốc", nhưng backend không mở hai khối đó cho `PET_OWNER`:
`/pets/:id/prescriptions`, `/pets/:id/lab-tests` và các route cùng nhóm đều yêu cầu
`MEDICAL_RECORD_VIEW`, mà ma trận `role_permissions` không cấp cho chủ nuôi (xem
`veterinary-clinic-backend/src/modules/pets/presentation/pets.controller.ts`). Cổng tự
phục vụ của họ chỉ có `/pets/:id` và `/pets/:id/timeline`.

Bốn tab thực tế: **Tổng quan · Lịch sử khám · Lịch hẹn · Tài liệu** — tab Tài liệu dựng
từ `examination.attachmentUrls` trong dòng thời gian, là dữ liệu thật chứ không phải một
khối rỗng dựng sẵn. Muốn có đủ sáu tab thì phải mở route phía backend trước.

**Không biến đây thành dashboard.** Không KPI, không biểu đồ, không bảng dữ liệu dày.
Đây là trải nghiệm khách hàng: thẻ lớn, ảnh thật, chữ dễ đọc, thuật ngữ y khoa được
dịch sang tiếng người.

### 2.3 Zone `clinical` — 11 màn hình · DOCTOR + RECEPTIONIST

Đây là zone được mở **cả ngày, mỗi ngày**. Một bác sĩ mở máy lúc 7h và ở trong bốn năm
màn hình này tới lúc về. Tối ưu ở đây là tối ưu *số lần bấm chuột trên mỗi ca khám*,
không phải tối ưu ấn tượng đầu tiên.

| # | Màn hình | URL | Người dùng chính |
|---|---|---|---|
| 13 | Lịch làm việc | `/staff/calendar` | Bác sĩ |
| 14 | Hàng chờ | `/staff/queue` | Lễ tân |
| 15 | Lịch hẹn | `/staff/appointments` | Cả hai |
| 16 | Chi tiết lịch hẹn | `/staff/appointments/:id` | Cả hai |
| 17 | Phiếu khám | `/staff/appointments/:id/exam` | Bác sĩ |
| 18 | Khách hàng | `/staff/customers` | Lễ tân |
| 19 | Chi tiết khách hàng | `/staff/customers/:id` | Lễ tân |
| 20 | Tìm bệnh nhân | `/staff/patients` | Cả hai |
| 21 | Hồ sơ bệnh nhân | `/staff/patients/:id` | Bác sĩ |
| 22 | Xét nghiệm | `/staff/laboratory` | Bác sĩ |
| 23 | Nhắc lịch tiêm | `/staff/vaccinations/due` | Lễ tân |

Nguyên tắc mật độ: **compact**. Hàng bảng 36px thay vì 48px, khoảng đệm thẻ 16px thay
vì 24px, chữ 13–14px cho dữ liệu bảng. Chỗ nào trống một cách "thoáng đãng" trong admin
thì trong clinical là một hàng bệnh nhân bị đẩy xuống dưới màn hình.

### 2.4 Zone `admin` — 19 màn hình · ADMIN + MANAGER + PHARMACIST + STAFF

| Nhóm | Màn hình | URL |
|---|---|---|
| Tổng quan | Tổng quan | `/staff` |
| Kinh doanh | Bán hàng tại quầy | `/staff/pos` |
| | Hoá đơn | `/staff/billing` |
| | Chi tiết hoá đơn | `/staff/billing/:id` |
| | Báo cáo | `/staff/reports` |
| Danh mục | Dịch vụ và thuốc | `/staff/catalog` |
| | Sản phẩm | `/staff/products` |
| | Danh mục hàng hoá | `/staff/categories` |
| | Nhà cung cấp | `/staff/suppliers` |
| Kho | Đơn đặt hàng | `/staff/purchase-orders` |
| | Nhận hàng | `/staff/goods-receipts` |
| | Kiểm kê | `/staff/stock-takes` |
| | Tồn kho | `/staff/inventory` |
| | Cảnh báo kho | `/staff/inventory/alerts` |
| | Quầy thuốc | `/staff/pharmacy` |
| Tổ chức | Chi nhánh | `/staff/branches` |
| | Hồ sơ nhân sự | `/staff/employees` |
| | Tài khoản | `/staff/users` |
| Hệ thống | Phân quyền | `/staff/permissions` |
| | Nhật ký kiểm toán | `/staff/audit-logs` |

**Màn hình `/staff` là một, nội dung là hai.** Bác sĩ và lễ tân mở `/staff` thấy công
việc hôm nay (lịch, hàng chờ, ca đang khám, cần tái khám, cảnh báo lâm sàng). Quản lý
và admin mở `/staff` thấy tình hình vận hành (doanh thu, lịch hẹn, tồn kho, cảnh báo
hạn dùng). Cùng một URL, cùng một layout, cùng một bộ component — khác *câu hỏi*.

Không nhồi KPI doanh thu vào tổng quan lâm sàng. Bác sĩ không ra quyết định nào dựa
trên doanh thu tháng.

---

## 3. Điều hướng

### 3.1 Nguyên tắc RBAC ở tầng giao diện

```
Frontend  = UX guard          (ẩn / disable / redirect / hiển thị Forbidden)
Backend   = security boundary (role_permissions - nguồn quyết định thật)
```

Ba hệ quả bắt buộc:

1. **"Không thấy nút" không đồng nghĩa "không có quyền".** Mọi hành động ghi vẫn phải
   được backend kiểm tra lại. Frontend giấu nút chỉ để người dùng không đâm vào 403.
2. **Cổng ngoài `/staff` chỉ hỏi một câu: có phải nhân viên không?** Danh sách vai trò
   nhân viên là `STAFF_ROLES`. Chi tiết quyền để từng module tự kiểm.
3. **Không render module không có quyền.** Không disable, không xám — không có trong
   sidebar. Người dùng không cần biết tồn tại thứ họ không dùng được.
4. **Giấu khỏi sidebar thì phải chặn cả URL — bằng CÙNG một danh sách.** Hai nơi này
   từng khai báo riêng: `nav-model.ts` lọc sidebar, còn `routes.tsx` của từng zone viết
   thẳng mảng vai trò ra. Chúng đã lệch nhau (sidebar giấu "Hàng chờ" khỏi dược sĩ,
   nhưng gõ thẳng `/staff/queue` vẫn vào được một trang chỉ để nhận 403). Nay cả hai đọc
   `src/types/permission-groups.ts`.
5. **Bị từ chối thì NÓI RA, đừng chuyển hướng im lặng.** Một nhân viên bấm vào liên kết
   đồng nghiệp gửi mà bị ném về Tổng quan sẽ tưởng liên kết hỏng và bấm lại vài lần.
   Ngoại lệ duy nhất là *sai khu vực* (chủ nuôi lạc vào `/staff`, hoặc nhân viên lạc
   sang `/my/*`): đó không phải chuyện thiếu quyền, và thứ đúng đắn là đưa họ về khu của
   mình chứ không phải một khung làm việc rỗng bao quanh một lời từ chối.

### 3.2 Ma trận quyền và điều hướng

| Nhóm quyền | Vai trò | Mục sidebar |
|---|---|---|
| Toàn hệ thống | ADMIN | tất cả |
| Danh mục, Báo cáo, Nhân sự | ADMIN, MANAGER | Dịch vụ và thuốc, Báo cáo, Hồ sơ nhân sự |
| Hàng hoá, Kho, Dược | ADMIN, MANAGER, PHARMACIST | Sản phẩm, Danh mục HH, Nhà cung cấp, Đơn đặt hàng, Nhận hàng, Kiểm kê, Quầy thuốc |
| Tồn kho (chỉ xem) | mọi nhân viên trừ DOCTOR | Tồn kho, Cảnh báo kho |
| Quầy | ADMIN, MANAGER, RECEPTIONIST, STAFF | Bán hàng, Hoá đơn |
| Lâm sàng | ADMIN, MANAGER, DOCTOR, RECEPTIONIST | Lịch làm việc, Hàng chờ, Lịch hẹn, Hồ sơ thú cưng, Xét nghiệm, Nhắc lịch tiêm |
| Quản trị hệ thống | ADMIN | Chi nhánh, Tài khoản, Phân quyền, Nhật ký |

### 3.3 Cấu trúc sidebar (StaffLayout)

Sidebar phẳng 25 mục hiện tại là danh sách, không phải kiến trúc thông tin: người dùng
phải đọc hết mới tìm được thứ cần. Thay bằng **6 nhóm có nhãn**, nhóm rỗng tự biến mất:

```
TỔNG QUAN
  - Tổng quan

LÂM SÀNG
  - Lịch làm việc
  - Hàng chờ
  - Lịch hẹn
  - Hồ sơ thú cưng
  - Xét nghiệm
  - Nhắc lịch tiêm

VẬN HÀNH
  - Khách hàng
  - Dịch vụ và thuốc
  - Sản phẩm
  - Danh mục hàng hoá
  - Nhà cung cấp
  - Đơn đặt hàng
  - Nhận hàng
  - Kiểm kê
  - Tồn kho
  - Cảnh báo kho
  - Quầy thuốc

KINH DOANH
  - Bán hàng
  - Hoá đơn
  - Báo cáo

TỔ CHỨC
  - Chi nhánh
  - Hồ sơ nhân sự
  - Tài khoản

HỆ THỐNG
  - Phân quyền
  - Nhật ký kiểm toán
```

Sidebar phải: **thu gọn được** (chỉ còn icon, ghi nhớ lựa chọn), **đánh dấu mục đang
mở**, **là drawer trên màn hình hẹp**, và **lọc theo quyền trước khi render**.

Với một bác sĩ, cây trên rút xuống còn 7 mục trong 2 nhóm. Với dược sĩ còn 9 mục. Đó là
điểm của việc chia nhóm: cùng một cấu trúc, mỗi người thấy phần của mình.

### 3.4 Topbar

```
[hamburger]  Breadcrumb              [Tìm nhanh]  [Chuông]  [Chi nhánh]  [Avatar]
```

- **Breadcrumb** suy ra từ URL, không khai báo tay ở từng trang.
- **Ngữ cảnh chi nhánh** hiện tên chi nhánh của tài khoản; ADMIN không gắn chi nhánh thì
  hiện "Toàn hệ thống".
- **Menu người dùng**: tên, vai trò, đăng xuất. Vai trò phải hiện — trong một phòng
  khám nhiều người dùng chung một máy, biết đang đăng nhập bằng tài khoản nào là chuyện
  an toàn dữ liệu.

### 3.5 Header (PublicLayout)

Hai trạng thái, một cấu trúc:

```
GUEST      Logo | Dịch vụ  Bác sĩ  Chi nhánh  Tư vấn AI | [Đặt lịch khám] [Đăng nhập]
PET_OWNER  Logo | Dịch vụ  Bác sĩ  Chi nhánh  Tư vấn AI | Thú cưng  Lịch hẹn | [Đặt lịch] [Avatar]
```

Nhóm điều hướng công khai giữ nguyên vị trí khi đăng nhập — chủ nuôi vẫn là khách của
trang giới thiệu. Phần tài khoản *thêm vào*, không *thay thế*.

---

## 4. Luồng người dùng chính

### 4.1 Đặt lịch (luồng quan trọng nhất của zone public)

```
Dịch vụ > Chi nhánh > Bác sĩ > Ngày > Giờ > Thông tin chủ nuôi > Thông tin thú cưng > Xác nhận
```

Giảm ma sát ở ba chỗ:

- **Khách vãng lai vẫn đặt được.** Không bắt đăng ký trước. Tài khoản được tạo (hoặc
  ghép) từ số điện thoại ở bước xác nhận.
- **Đã đăng nhập thì bỏ hai bước.** Thông tin chủ nuôi lấy từ tài khoản; thú cưng
  chuyển từ *nhập tay* thành *chọn từ danh sách đã có* (kèm nút "Thêm bé mới").
- **Vào giữa luồng được.** Bấm "Đặt lịch" từ thẻ dịch vụ thì bước 1 đã điền sẵn; từ thẻ
  bác sĩ thì bước 2 và 3 đã điền sẵn. Đây là lý do các CTA ở trang chủ, trang dịch vụ và
  trang bác sĩ đều mang theo `state`.

Stepper phải cho **quay lại bước bất kỳ đã hoàn thành** mà không mất dữ liệu đã nhập.

### 4.2 Tiếp nhận, khám, thanh toán (luồng vận hành lõi)

```
Lễ tân                    Bác sĩ                        Quầy
------                    ------                        ----
Check-in lịch hẹn    ->   Nhận ca từ hàng chờ     ->    Hoá đơn
   hoặc                      |                            |
Thêm khách vãng lai       Phiếu khám                   Thanh toán
   |                         |
Phân loại ưu tiên         Chỉ định XN / kê đơn
   |                         |                         Quầy thuốc
Xếp hàng chờ              Hoàn tất + hẹn tái khám  ->  Cấp phát
```

Mỗi mũi tên phải là **một cú bấm từ màn hình trước**, không phải "quay về menu rồi tìm
màn hình tiếp theo". Cụ thể: hàng chờ có nút "Bắt đầu khám" đi thẳng vào phiếu khám;
phiếu khám hoàn tất có nút "Tạo hoá đơn"; hoá đơn có nút "Chuyển quầy thuốc".

### 4.3 Kho và dược

```
Sản phẩm > Nhà cung cấp > Đơn đặt hàng > Nhận hàng > Tồn kho > Quầy thuốc / Bán hàng
```

Trạng thái tồn phải đọc được **không cần nhìn màu**: `Còn hàng` / `Sắp hết` / `Hết
hàng` luôn đi kèm chữ và icon. Hạn dùng gần thì hiện số ngày còn lại, không chỉ tô đỏ.
Màu đỏ trong hệ thống này chỉ dành cho *cần hành động ngay*, không dùng để trang trí.

### 4.4 Chủ nuôi

```
Thú cưng của tôi > Hồ sơ bé > (Bệnh án / Tiêm phòng / Đơn thuốc / Lịch hẹn / Tài liệu)
                            > Đặt lịch cho bé này -> luồng 4.1 rút gọn còn 5 bước
```

---

## 5. Design System

### 5.1 Token

Nguồn giá trị thật nằm ở CSS custom property trong `src/index.css`; `tailwind.config.ts`
chỉ nối chúng vào tên lớp. Đổi giao diện bằng cách đổi ở `index.css`, không sửa
component.

| Nhóm | Token | Ghi chú |
|---|---|---|
| Thương hiệu | `primary`, `primary-foreground` | Teal - đọc ra "y tế" mà ấm hơn xanh dương công nghệ |
| Nền | `surface`, `surface-muted`, `surface-raised` | Nền hơi ngả ấm, không xám thuần |
| Chữ | `foreground`, `muted` | |
| Viền | `border`, `border-strong` | |
| Trạng thái | `success`, `warning`, `danger`, `info` | Mỗi màu có biến `-soft` cho nền nhạt |
| Phân loại ưu tiên | `triage.red/orange/yellow/green/blue` | **Nghĩa nghiệp vụ cố định**, không phải lựa chọn thẩm mỹ - không đưa qua biến |
| Hình khối | `--radius` (0.625rem) | Một giá trị, các cấp khác tính từ nó |

Màu **không bao giờ là kênh thông tin duy nhất**. Mọi trạng thái đều có chữ, phần lớn có
thêm icon.

### 5.2 Mật độ

Hai chế độ, không phải hai bộ token:

| | `comfortable` (public, owner, admin) | `compact` (clinical) |
|---|---|---|
| Hàng bảng | 48px | 36px |
| Đệm thẻ | 20-24px | 12-16px |
| Chữ dữ liệu | 14px | 13px |
| Khoảng cách khối | 24px | 16px |

### 5.3 Danh mục component

| Đã có từ trước | Bổ sung trong đợt thiết kế lại |
|---|---|
| Button, Input, Textarea, Checkbox, CheckboxGroup, Select, Combobox, DatePicker, Badge, TriageBadge, Modal, Toast, Table, Pagination, Card, PageHeader, Skeleton, EmptyState, ErrorState | Icon, Avatar, StatusBadge, Tabs, Drawer, DropdownMenu, Alert, Tooltip, Breadcrumb, ConfirmDialog, SearchInput, DataTable, DescriptionList, Timeline, StatTile, ForbiddenState |

`Icon` thay cho emoji ở mọi chỗ dày đặc (điều hướng, bảng, nút): emoji mỗi hệ điều hành
vẽ một kiểu, không đổi màu theo trạng thái được, và trên thanh điều hướng của phần mềm
phòng khám thì đọc ra "trang web dễ thương" chứ không phải "công cụ làm việc". Emoji vẫn
dùng ở trạng thái rỗng, nơi nó là hình minh hoạ lớn.

Hộp thoại của trình duyệt (`window.prompt` / `alert` / `confirm`) **không còn được dùng**:
chúng chặn cả tab, không định dạng được nên không nói rõ đang thao tác trên bản ghi nào,
và không kiểm tra được đầu vào trước khi đóng. Ba chỗ từng dùng chúng nay là
`CancelAppointmentDialog`, `MarkNoShowDialog`, `CancelQueueEntryDialog`.

`DataTable` bằng `Table` cộng thanh công cụ (tìm kiếm, bộ lọc, chọn cột) cộng hành động
hàng loạt cộng hành động trên từng hàng. Các trang admin dùng `DataTable`; các bảng nhúng
nhỏ vẫn dùng `Table` trần.

**Không trang nào được tự dựng `<table>` nữa.** Mỗi bảng viết tay là một bảng thiếu ít
nhất một trạng thái: `BillingListPage` và `UsersAdminPage` từng có bảng riêng, chữ
"Đang tải…" thay cho skeleton, và không có nhánh lỗi nào — máy chủ hỏng hiện ra y hệt
"chưa có hoá đơn nào". Ba tab Dịch vụ / Thuốc / Vaccine còn sửa tại chỗ trên từng hàng
nên chưa chuyển được sang `Table`; chúng dùng `TabTableStates` để có đủ ba trạng thái
dưới dạng hàng của `<tbody>`.

### 5.4 Những thứ không dùng

Đây là danh sách chặn, không phải gợi ý:

- gradient tím / gradient AI
- hero chiếm trọn màn hình
- bo góc cực đại (`rounded-2xl` cho mọi thứ)
- nhiều lớp đổ bóng
- hiệu ứng kính mờ
- biểu đồ trang trí (biểu đồ không trả lời câu hỏi nào)
- lưới thẻ đồng đều cho dữ liệu vốn là bảng
- dữ liệu giả kiểu `User 1` / `Product A` / lorem ipsum

Dữ liệu mẫu phải thật: `Luna - Golden Retriever - 3 tuổi`, `Nguyễn Minh Anh`,
`BS. Trần Minh Đức`, `250.000 đ`.

### 5.5 Trạng thái giao diện bắt buộc

Mọi màn hình có dữ liệu từ mạng phải xử lý đủ **5 trạng thái**:

| Trạng thái | Thể hiện |
|---|---|
| Đang tải | Skeleton đúng hình dạng nội dung sắp hiện — không phải spinner giữa màn hình, và không phải dòng chữ "Đang tải…" |
| Rỗng | Câu giải thích cộng hành động thoát khỏi trạng thái rỗng |
| Lỗi | Vấn đề, nguyên nhân nếu biết, nút Thử lại |
| Thành công | Toast hoặc phản hồi tại chỗ |
| Không có quyền | Câu giải thích cộng nút quay về Tổng quan |

Trạng thái thứ năm có ba cửa vào, tuỳ chỗ phát hiện ra việc thiếu quyền:

| Phát hiện ở đâu | Ai xử lý | Thấy gì |
|---|---|---|
| Trước khi vào route (sai vai trò) | `RequireAuth` | `ForbiddenState` nằm TRONG khung hiện tại — sidebar và topbar còn nguyên để người dùng đi tiếp chỗ khác |
| Khi tải dữ liệu (API trả 403) | `QueryErrorState` | `ForbiddenState` thay cho `ErrorState` — nút "Thử lại" trên một lỗi 403 là mời người ta làm việc vô ích |
| Trong một khối của trang | ví dụ `OpenRecordError` | Phần còn lại của trang vẫn hiện; chỉ khối bị chặn được thay bằng lời giải thích |

Ví dụ cho hàng thứ ba: lễ tân mở `/staff/appointments/:id/exam` vẫn xem được đầu trang
(bé nào, bác sĩ nào, mấy giờ) vì họ có quyền xem lịch hẹn — chỉ khối phiếu khám đổi
thành "Chỉ bác sĩ được lập và xem hồ sơ bệnh án", kèm nút về hàng chờ.

Ranh giới quan trọng nhất của bảng: **lỗi tải khác danh sách rỗng.** Một bảng hỏng mà
hiện "Không có dữ liệu" đang nói dối người dùng — trên màn hình tồn kho, đó là khác biệt
giữa "máy chủ không trả lời" và "kho hết sạch hàng". `Table`, `DataTable` và
`TabTableStates` đều tách hai nhánh này, và `src/components/basic/Table.test.tsx` giữ cho
chúng không nhập lại làm một.

### 5.6 Khả năng tiếp cận - WCAG 2.1 AA

- Mọi thứ bấm được đều tới được bằng `Tab`, có vòng focus nhìn thấy.
- Mục tiêu chạm tối thiểu **44x44px** trên màn hình cảm ứng.
- Hộp thoại: bẫy focus, `Esc` đóng, trả focus về nút đã mở.
- Bảng: `<th scope>`, `aria-sort` trên cột đang sắp xếp.
- Biểu mẫu: mỗi input một `<label htmlFor>`; lỗi nối vào input bằng `aria-describedby`.
- Tương phản: 4.5:1 cho chữ thường, 3:1 cho chữ lớn.
- Tôn trọng `prefers-reduced-motion`.

### 5.7 Điểm ngắt

`320 - 375 - 768 - 1024 - 1440`

| Zone | Điều cần chú ý ở màn hình hẹp |
|---|---|
| public | Menu gấp, CTA đặt lịch luôn thấy |
| owner | Thẻ thú cưng một cột, stepper đặt lịch cuộn dọc |
| clinical | Hàng chờ và lịch hẹn chuyển thành thẻ; phiếu khám 3 cột xếp chồng |
| admin | Bảng cuộn ngang trong khung riêng - **trang không bao giờ cuộn ngang** |


---

## 6. Những thứ CỐ Ý chưa làm

Ghi lại để lần sau không ai phải dò lại từ đầu rồi kết luận y hệt.

| Thứ | Vì sao chưa làm |
|---|---|
| Quên mật khẩu / đặt lại mật khẩu | `auth.controller.ts` phía backend chỉ có `register`, `login`, `refresh`, `logout`. Dựng biểu mẫu "Quên mật khẩu" bây giờ là dựng một ngõ cụt: người dùng nhập số điện thoại rồi không bao giờ nhận được gì. Mở endpoint trước, màn hình sau. |
| Màn hình "Cài đặt hệ thống" | Không có trong 42 màn hình, và cũng chưa có nhóm cấu hình nào ở backend cần một trang riêng. Những thứ giống "cài đặt" hiện đang nằm đúng chỗ của chúng: chi nhánh ở `/staff/branches`, quyền ở `/staff/permissions`, danh mục ở `/staff/catalog`. |
| Chuyển ba tab Dịch vụ / Thuốc / Vaccine sang `DataTable` | Chúng sửa tại chỗ ngay trên hàng của bảng, mà `DataTable` chưa có chế độ đó. Đưa việc sửa vào hộp thoại như `UsersAdminPage` đã làm thì chuyển được — nhưng đó là đổi cách làm việc của người dùng, nên tách thành một đợt riêng. Trước mắt chúng đã có đủ ba trạng thái nhờ `TabTableStates`. |
| Tab "Tiêm phòng" và "Đơn thuốc" trong hồ sơ thú cưng của CHỦ NUÔI | Backend yêu cầu `MEDICAL_RECORD_VIEW` cho các route đó, mà ma trận quyền không cấp cho `PET_OWNER` (xem mục 2.2). Bốn tab hiện có đều dựng từ dữ liệu thật. |
