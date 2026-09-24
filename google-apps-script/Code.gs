/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO HỆ THỐNG ĐĂNG NHẬP (REACT + GOOGLE SHEETS)
 * ==============================================================================
 * 
 * BẢO MẬT MẬT KHẨU:
 *  - Mật khẩu được MÃ HÓA SHA-256 ở phía client (React) TRƯỚC KHI gửi lên server.
 *  - Google Sheets chỉ lưu chuỗi hash SHA-256 (hex), KHÔNG BAO GIỜ lưu mật khẩu gốc.
 *  - Khi đăng nhập, client tự hash mật khẩu và gửi hash để so sánh với hash đã lưu.
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE SHEETS:
 * 1. Mở hoặc tạo một Google Sheet mới tại https://sheets.google.com
 * 2. Trên menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa toàn bộ mã cũ trong trình soạn thảo và dán toàn bộ nội dung file này vào.
 * 4. Nhấn nút "Lưu" (biểu tượng đĩa mềm hoặc Ctrl + S).
 * 5. (Tùy chọn) Chọn hàm "initDatabase" ở thanh công cụ và nhấn "Chạy" (Run)
 *    để tự động tạo tiêu đề và tài khoản mẫu (admin/admin123, user/user123).
 * 6. Triển khai Web App:
 *    - Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> "Triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app) (biểu tượng bánh răng).
 *    - Cấu hình:
 *        + Mô tả: Web App Auth API
 *        + Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *        + Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 *    - Nhấn "Triển khai" (Deploy) -> Cấp quyền truy cập nếu Google yêu cầu.
 *    - Copy "URL của ứng dụng web" (Web App URL) có đuôi dạng /exec và dán vào ứng dụng React!
 */

// Tên trang tính lưu trữ tài khoản
const SHEET_NAME = 'Users';

// ============================================================
// 🔐 HÀM MÃ HÓA MẬT KHẨU SHA-256
// ============================================================

/**
 * Tính SHA-256 hash của một chuỗi văn bản và trả về chuỗi hex chữ thường.
 * Dùng overload 2 tham số — Google Apps Script tự dùng UTF-8 khi value là String.
 */
function hashPassword(plainText) {
  if (!plainText) return '';
  // Chỉ truyền 2 tham số: algorithm + string value (UTF-8 là mặc định)
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plainText)
  );
  // Chuyển mảng byte (có thể âm) sang chuỗi hex 64 ký tự
  return bytes.map(function(b) {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// ============================================================
// 🗄️ KHỞI TẠO CƠ SỞ DỮ LIỆU
// ============================================================

/**
 * Hàm khởi tạo cơ sở dữ liệu và thêm tài khoản mẫu ban đầu.
 * Chọn hàm này ở thanh công cụ rồi bấm "Chạy" (Run) để khởi tạo.
 * Mật khẩu mẫu được lưu dưới dạng hash SHA-256.
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Kiểm tra nếu chưa có tiêu đề (bảng rỗng)
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'username', 'passwordHash', 'fullName', 'role', 'status', 'createdAt', 'lastLogin'];
    sheet.appendRow(headers);

    // Style cho dòng header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    // Tạo tài khoản mẫu với mật khẩu đã được hash SHA-256
    const now = new Date().toISOString();
    sheet.appendRow([
      'USR_' + new Date().getTime(),
      'admin',
      hashPassword('admin123'),        // ← lưu hash, không lưu plaintext
      'Administrator',
      'admin',
      'active',
      now,
      ''
    ]);
    sheet.appendRow([
      'USR_' + (new Date().getTime() + 1),
      'user',
      hashPassword('user123'),         // ← lưu hash, không lưu plaintext
      'Thành viên thử nghiệm',
      'user',
      'active',
      now,
      ''
    ]);

    Logger.log('✅ Đã tạo bảng Users và 2 tài khoản mẫu (mật khẩu đã được mã hóa SHA-256)');
  }

  return { success: true, message: 'Database initialized successfully' };
}

// ============================================================
// 🌐 HTTP HANDLERS
// ============================================================

/**
 * Xử lý yêu cầu GET (ping, init)
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : '';

    if (action === 'init') {
      return createJsonResponse(initDatabase());
    }

    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Google Apps Script Auth API đang hoạt động bình thường!',
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({
      success: true,
      service: 'Hokage Dev Auth API',
      status: 'online',
      message: 'Gửi yêu cầu POST chứa JSON để đăng nhập.'
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Lỗi máy chủ Apps Script: ' + error.toString()
    });
  }
}

/**
 * Xử lý yêu cầu POST (đăng nhập, đăng ký)
 * Client gửi lên: { action, username, passwordHash } — KHÔNG GỬI MẬT KHẨU GỐC
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        message: 'Dữ liệu yêu cầu không hợp lệ hoặc rỗng.'
      });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJsonResponse({
        success: false,
        message: 'Định dạng dữ liệu không phải JSON hợp lệ.'
      });
    }

    const action = payload.action || 'login';

    if (action === 'login') {
      const username = (payload.username || '').toString().trim();
      const passwordHash = (payload.passwordHash || '').toString();
      return createJsonResponse(handleLogin(username, passwordHash));
    }

    if (action === 'register') {
      return createJsonResponse(handleRegister(payload));
    }

    return createJsonResponse({
      success: false,
      message: 'Hành động không được hỗ trợ: ' + action
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      message: 'Lỗi máy chủ: ' + err.toString()
    });
  }
}

// ============================================================
// 🔑 ĐĂNG NHẬP
// ============================================================

/**
 * Xác thực người dùng bằng cách so sánh SHA-256 hash.
 * @param {string} username - Tên đăng nhập
 * @param {string} passwordHash - SHA-256 hash của mật khẩu (từ client)
 */
function handleLogin(username, passwordHash) {
  if (!username || !passwordHash) {
    return {
      success: false,
      message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.'
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Tìm chỉ số các cột (tương thích cả cột 'password' cũ lẫn 'passwordHash' mới)
  const passwordCol = headers.indexOf('passwordHash') !== -1
    ? headers.indexOf('passwordHash')
    : headers.indexOf('password');

  const colIndex = {
    id:           headers.indexOf('id'),
    username:     headers.indexOf('username'),
    passwordHash: passwordCol,
    fullName:     headers.indexOf('fullName'),
    role:         headers.indexOf('role'),
    status:       headers.indexOf('status'),
    lastLogin:    headers.indexOf('lastLogin')
  };

  const cleanInputUser = username.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser   = (row[colIndex.username]     || '').toString().trim().toLowerCase();
    const rowHash   = (row[colIndex.passwordHash] || '').toString().trim().toLowerCase();
    const rowStatus = (row[colIndex.status]       || 'active').toString().toLowerCase();

    if (rowUser !== cleanInputUser) continue;

    // So sánh hash (case-insensitive)
    if (rowHash !== passwordHash.toLowerCase()) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác.'
      };
    }

    if (rowStatus !== 'active') {
      return {
        success: false,
        message: 'Tài khoản này đang bị vô hiệu hóa hoặc tạm khóa.'
      };
    }

    // Cập nhật thời gian đăng nhập mới nhất
    const nowStr = new Date().toISOString();
    if (colIndex.lastLogin !== -1) {
      sheet.getRange(i + 1, colIndex.lastLogin + 1).setValue(nowStr);
    }

    return {
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id:        row[colIndex.id] || ('USR_' + i),
        username:  row[colIndex.username],
        fullName:  row[colIndex.fullName] || row[colIndex.username],
        role:      row[colIndex.role] || 'user',
        lastLogin: nowStr
      }
    };
  }

  return {
    success: false,
    message: 'Tài khoản không tồn tại trên hệ thống.'
  };
}

// ============================================================
// 📝 ĐĂNG KÝ
// ============================================================

/**
 * Đăng ký người dùng mới.
 * Client gửi lên { username, passwordHash, fullName, role } — KHÔNG GỬI MẬT KHẨU GỐC.
 */
function handleRegister(payload) {
  const username     = (payload.username     || '').toString().trim();
  const passwordHash = (payload.passwordHash || '').toString().trim();
  const fullName     = (payload.fullName     || username).toString().trim();
  const role         = payload.role || 'user';

  if (!username || !passwordHash) {
    return {
      success: false,
      message: 'Vui lòng điền tên đăng nhập và mật khẩu.'
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const userCol = headers.indexOf('username');

  // Kiểm tra trùng username
  for (let i = 1; i < data.length; i++) {
    if ((data[i][userCol] || '').toString().toLowerCase() === username.toLowerCase()) {
      return {
        success: false,
        message: 'Tên đăng nhập đã tồn tại.'
      };
    }
  }

  const newId = 'USR_' + new Date().getTime();
  const now   = new Date().toISOString();

  sheet.appendRow([
    newId,
    username,
    passwordHash,   // ← lưu hash, không lưu plaintext
    fullName,
    role,
    'active',
    now,
    ''
  ]);

  return {
    success: true,
    message: 'Đăng ký tài khoản thành công!',
    user: {
      id:       newId,
      username: username,
      fullName: fullName,
      role:     role
    }
  };
}

// ============================================================
// 🛠️ HELPERS
// ============================================================

/**
 * Tạo HTTP response kiểu JSON chuẩn
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
