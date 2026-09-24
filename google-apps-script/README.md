# Hướng Dẫn Thiết Lập Google Apps Script Làm Database Đăng Nhập

Tài liệu này hướng dẫn bạn cách tạo một cơ sở dữ liệu trên **Google Sheets** và sử dụng **Google Apps Script** làm API xác thực cho ứng dụng React.

---

## 🚀 Các Bước Thực Hiện

### Bước 1: Tạo Google Sheets
1. Truy cập vào [Google Sheets](https://sheets.google.com) và tạo một bảng tính mới (ví dụ đặt tên: `HokageAuthDB`).
2. Không cần tạo sẵn bảng hay cột, script sẽ tự động tạo bảng `Users` và 2 tài khoản mẫu.

### Bước 2: Dán Code Google Apps Script
1. Trên thanh menu của Google Sheet, bấm: **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Một cửa sổ soạn thảo code sẽ mở ra. Xóa toàn bộ nội dung mặc định trong file `Mã.gs` (hoặc `Code.gs`).
3. Mở file [google-apps-script/Code.gs](file:///d:/VNTD/Project/hokagedevu/google-apps-script/Code.gs) trong dự án này, copy toàn bộ nội dung và dán vào Apps Script.
4. Bấm biểu tượng **Lưu** (hình đĩa mềm hoặc phím `Ctrl + S`).

### Bước 3: Chạy Khởi Tạo Dữ Liệu Mẫu
1. Tại thanh công cụ phía trên màn hình Apps Script, chọn hàm `initDatabase` từ danh sách thả xuống.
2. Bấm nút **Chạy (Run)**.
3. Khi được yêu cầu cấp quyền (**Authorization Required**):
   - Bấm **Xem lại quyền (Review Permissions)**.
   - Chọn tài khoản Google của bạn.
   - Bấm **Nâng cao (Advanced)** -> Chọn **Đi tới ... (không an toàn)**.
   - Bấm **Cho phép (Allow)**.
4. Sau khi chạy xong, quay lại Google Sheet, bạn sẽ thấy sheet `Users` đã được tạo kèm 2 tài khoản mẫu:
   - `admin` / `admin123` (Quyền: Administrator)
   - `user` / `user123` (Quyền: Thành viên thử nghiệm)

### Bước 4: Triển Khai Thành Web App (Quan Trọng Nhất)
Để ứng dụng React có thể gọi API mà không bị lỗi CORS hay quyền truy cập:
1. Nhấn nút xanh **Triển khai (Deploy)** ở góc trên bên phải -> chọn **Triển khai mới (New deployment)**.
2. Bấm vào biểu tượng **Bánh răng (Select type)** bên cạnh -> Chọn **Ứng dụng web (Web app)**.
3. Điền các trường cấu hình như sau:
   - **Mô tả (Description)**: `Auth Web App API`
   - **Thực thi dưới dạng (Execute as)**: Chọn **Tôi (Me - email của bạn)**.
   - **Ai có quyền truy cập (Who has access)**: Chọn **Bất kỳ ai (Anyone)**.
     *(⚠️ Bắt buộc chọn "Anyone" để web React gọi được mà không bắt người dùng đăng nhập tài khoản Google).*
4. Nhấn **Triển khai (Deploy)**.
5. Sao chép đường dẫn **URL của ứng dụng web (Web app URL)**. Đường link sẽ có dạng:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

### Bước 5: Cấu Hình URL Vào Web React
1. Mở giao diện đăng nhập trên trình duyệt.
2. Bấm vào nút **Cấu hình Google Script URL** (hoặc biểu tượng bánh răng) trên giao diện.
3. Dán URL đã copy ở Bước 4 vào ô nhập và bấm **Lưu & Kiểm tra kết nối**.
4. Bạn có thể đăng nhập ngay với tài khoản `admin` / `admin123` hoặc thêm bất kỳ dòng người dùng nào trực tiếp vào Google Sheet!
