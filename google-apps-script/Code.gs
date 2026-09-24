/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO HỆ THỐNG ĐĂNG NHẬP (REACT + GOOGLE SHEETS)
 * ==============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRÊN GOOGLE SHEETS:
 * 1. Mở hoặc tạo một Google Sheet mới tại https://sheets.google.com
 * 2. Trên menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script
 * 3. Xóa toàn bộ mã cũ trong trình soạn thảo và dán toàn bộ nội dung file này vào.
 * 4. Nhấn nút "Lưu" (biểu tượng đĩa mềm hoặc Ctrl + S).
 * 5. (Tùy chọn) Chọn hàm "initDatabase" ở thanh công cụ và nhấn "Chạy" (Run) 
 *    để tự động tạo tiêu đề và tài khoản mẫu (admin / admin123).
 * 6. Triển khai Web App:
 *    - Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> "Triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app) (biểu tượng bánh răng).
 *    - Cấu hình:
 *        + Mô tả: Web App Auth API
 *        + Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *        + Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 *          (LƯU Ý QUAN TRỌNG: Phải chọn "Anyone" để ứng dụng web React gọi được API mà không bị chặn).
 *    - Nhấn "Triển khai" (Deploy) -> Cấp quyền truy cập nếu Google yêu cầu.
 *    - Copy "URL của ứng dụng web" (Web App URL) có đuôi dạng /exec và dán vào ứng dụng React!
 */

// Tên trang tính lưu trữ tài khoản
const SHEET_NAME = 'Users';

/**
 * Hàm khởi tạo cơ sở dữ liệu và thêm tài khoản mẫu ban đầu
 * Bạn có thể chọn hàm này và bấm "Run" để chạy thử
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Kiểm tra nếu chưa có tiêu đề
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'username', 'password', 'fullName', 'role', 'status', 'createdAt', 'lastLogin'];
    sheet.appendRow(headers);
    
    // Style cho dòng header
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Tạo tài khoản mẫu ban đầu
    const now = new Date().toISOString();
    sheet.appendRow([
      'USR_' + new Date().getTime(),
      'admin',
      'admin123',
      'Administrator',
      'admin',
      'active',
      now,
      ''
    ]);
    sheet.appendRow([
      'USR_' + (new Date().getTime() + 1),
      'user',
      'user123',
      'Thành viên thử nghiệm',
      'user',
      'active',
      now,
      ''
    ]);
    
    Logger.log('Đã tạo bảng Users và 2 tài khoản mẫu (admin/admin123, user/user123)');
  }
  return { success: true, message: 'Database initialized successfully' };
}

/**
 * Xử lý yêu cầu GET (dùng để kiểm tra kết nối hoặc ping)
 */
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : '';
    
    if (action === 'init') {
      const initRes = initDatabase();
      return createJsonResponse(initRes);
    }
    
    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Google Apps Script Auth API đang hoạt động bình thường!',
        timestamp: new Date().toISOString()
      });
    }

    // Hỗ trợ đăng nhập qua GET (nếu cần kiểm tra nhanh trên trình duyệt)
    if (action === 'login') {
      const username = e.parameter.username || '';
      const password = e.parameter.password || '';
      return createJsonResponse(handleLogin(username, password));
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
      const password = (payload.password || '').toString();
      const result = handleLogin(username, password);
      return createJsonResponse(result);
    }

    if (action === 'register') {
      const result = handleRegister(payload);
      return createJsonResponse(result);
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

/**
 * Hàm xử lý đăng nhập người dùng
 */
function handleLogin(username, password) {
  if (!username || !password) {
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
  
  // Tìm chỉ số các cột
  const colIndex = {
    id: headers.indexOf('id'),
    username: headers.indexOf('username'),
    password: headers.indexOf('password'),
    fullName: headers.indexOf('fullName'),
    role: headers.indexOf('role'),
    status: headers.indexOf('status'),
    lastLogin: headers.indexOf('lastLogin')
  };

  const cleanInputUser = username.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser = (row[colIndex.username] || '').toString().trim().toLowerCase();
    const rowPass = (row[colIndex.password] || '').toString();
    const rowStatus = (row[colIndex.status] || 'active').toString().toLowerCase();

    if (rowUser === cleanInputUser) {
      if (rowPass !== password) {
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
          id: row[colIndex.id] || ('USR_' + i),
          username: row[colIndex.username],
          fullName: row[colIndex.fullName] || row[colIndex.username],
          role: row[colIndex.role] || 'user',
          lastLogin: nowStr
        }
      };
    }
  }

  return {
    success: false,
    message: 'Tài khoản không tồn tại trên hệ thống.'
  };
}

/**
 * Hàm xử lý đăng ký người dùng mới (tiện ích mở rộng)
 */
function handleRegister(payload) {
  const username = (payload.username || '').toString().trim();
  const password = (payload.password || '').toString();
  const fullName = (payload.fullName || username).toString().trim();
  const role = payload.role || 'user';

  if (!username || !password) {
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

  const data = sheet.getDataRange().getValues();
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
  const now = new Date().toISOString();

  sheet.appendRow([
    newId,
    username,
    password,
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
      id: newId,
      username: username,
      fullName: fullName,
      role: role
    }
  };
}

/**
 * Helper tạo phản hồi JSON với header chuẩn
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
