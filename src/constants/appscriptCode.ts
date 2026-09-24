export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO HỆ THỐNG ĐĂNG NHẬP (REACT + GOOGLE SHEETS)
 * ==============================================================================
 * Tự động tạo bảng 'Users' và 2 tài khoản mẫu:
 *   1) admin / admin123  (Role: admin)
 *   2) user / user123    (Role: user)
 */

const SHEET_NAME = 'Users';

function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'username', 'password', 'fullName', 'role', 'status', 'createdAt', 'lastLogin'];
    sheet.appendRow(headers);
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
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
    Logger.log('Khởi tạo thành công!');
  }
  return { success: true, message: 'Database đã sẵn sàng' };
}

function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : '';
    
    if (action === 'init') {
      return createJsonResponse(initDatabase());
    }
    
    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Google Apps Script Auth API đang online!',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'login') {
      const username = e.parameter.username || '';
      const password = e.parameter.password || '';
      return createJsonResponse(handleLogin(username, password));
    }

    return createJsonResponse({
      success: true,
      service: 'Hokage Dev Auth API',
      status: 'online'
    });
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'Lỗi: ' + error.toString()
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: 'Thiếu dữ liệu' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJsonResponse({ success: false, message: 'JSON không hợp lệ' });
    }

    const action = payload.action || 'login';

    if (action === 'login') {
      const username = (payload.username || '').toString().trim();
      const password = (payload.password || '').toString();
      return createJsonResponse(handleLogin(username, password));
    }

    return createJsonResponse({
      success: false,
      message: 'Hành động không hợp lệ: ' + action
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: 'Lỗi máy chủ: ' + err.toString()
    });
  }
}

function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, message: 'Vui lòng điền đủ tài khoản và mật khẩu.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() < 2) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const colIndex = {
    id: headers.indexOf('id'),
    username: headers.indexOf('username'),
    password: headers.indexOf('password'),
    fullName: headers.indexOf('fullName'),
    role: headers.indexOf('role'),
    status: headers.indexOf('status'),
    lastLogin: headers.indexOf('lastLogin')
  };

  const cleanUser = username.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUser = (row[colIndex.username] || '').toString().trim().toLowerCase();
    const rowPass = (row[colIndex.password] || '').toString();
    const rowStatus = (row[colIndex.status] || 'active').toString().toLowerCase();

    if (rowUser === cleanUser) {
      if (rowPass !== password) {
        return { success: false, message: 'Mật khẩu không chính xác.' };
      }
      if (rowStatus !== 'active') {
        return { success: false, message: 'Tài khoản đang bị khóa.' };
      }

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

  return { success: false, message: 'Tài khoản không tồn tại trên hệ thống.' };
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
