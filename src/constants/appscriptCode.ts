export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND - MÃ HÓA MẬT KHẨU SHA-256
 * ==============================================================================
 * BẢO MẬT:
 *  - Client (React) hash SHA-256 mật khẩu TRƯỚC KHI gửi lên.
 *  - Sheets chỉ lưu chuỗi hash hex 64 ký tự - KHÔNG LƯU MẬT KHẨU GỐC.
 *  - So sánh đăng nhập là so sánh hash vs hash.
 * Tài khoản mẫu: admin / admin123  và  user / user123
 */

const SHEET_NAME = 'Users';

// ---- SHA-256 HASH (Google Apps Script native) ----
// Dùng 2-arg overload — UTF-8 là mặc định khi value là String.
// KHÔNG dùng Utilities.Charset.UTF_8 làm tham số thứ 3 (sẽ gây lỗi null).
function hashPassword(plainText) {
  if (!plainText) return '';
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plainText)
  );
  return bytes.map(function(b) {
    const hex = (b < 0 ? b + 256 : b).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// ---- KHỞI TẠO DATABASE ----
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    const headers = ['id', 'username', 'passwordHash', 'fullName', 'role', 'status', 'createdAt', 'lastLogin'];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    const now = new Date().toISOString();
    sheet.appendRow([
      'USR_' + new Date().getTime(), 'admin',
      hashPassword('admin123'),      // ← SHA-256 hash
      'Administrator', 'admin', 'active', now, ''
    ]);
    sheet.appendRow([
      'USR_' + (new Date().getTime() + 1), 'user',
      hashPassword('user123'),       // ← SHA-256 hash
      'Thành viên thử nghiệm', 'user', 'active', now, ''
    ]);
    Logger.log('✅ Khởi tạo xong! Mật khẩu đã được mã hóa SHA-256.');
  }
  return { success: true, message: 'Database initialized' };
}

// ---- HTTP GET (ping / init) ----
function doGet(e) {
  try {
    const action = e.parameter ? e.parameter.action : '';
    if (action === 'init')  return createJsonResponse(initDatabase());
    if (action === 'ping')  return createJsonResponse({
      success: true, message: 'API online!', timestamp: new Date().toISOString()
    });
    return createJsonResponse({ success: true, service: 'Hokage Dev Auth API', status: 'online' });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.toString() });
  }
}

// ---- HTTP POST (login / register) ----
function doPost(e) {
  try {
    if (!e?.postData?.contents) {
      return createJsonResponse({ success: false, message: 'Thiếu dữ liệu' });
    }
    let payload;
    try { payload = JSON.parse(e.postData.contents); }
    catch (_) { return createJsonResponse({ success: false, message: 'JSON không hợp lệ' }); }

    if (payload.action === 'login') {
      return createJsonResponse(handleLogin(
        (payload.username || '').toString().trim(),
        (payload.passwordHash || '').toString()   // nhận hash, KHÔNG nhận plaintext
      ));
    }
    if (payload.action === 'register') {
      return createJsonResponse(handleRegister(payload));
    }
    return createJsonResponse({ success: false, message: 'Action không hợp lệ: ' + payload.action });
  } catch (err) {
    return createJsonResponse({ success: false, message: 'Lỗi máy chủ: ' + err.toString() });
  }
}

// ---- ĐĂNG NHẬP (so sánh hash) ----
function handleLogin(username, passwordHash) {
  if (!username || !passwordHash) {
    return { success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_NAME);
  }

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  // Tương thích cả cột tên cũ 'password' lẫn mới 'passwordHash'
  const passCol = headers.indexOf('passwordHash') !== -1
    ? headers.indexOf('passwordHash')
    : headers.indexOf('password');

  const col = {
    id:        headers.indexOf('id'),
    username:  headers.indexOf('username'),
    passHash:  passCol,
    fullName:  headers.indexOf('fullName'),
    role:      headers.indexOf('role'),
    status:    headers.indexOf('status'),
    lastLogin: headers.indexOf('lastLogin')
  };

  const cleanUser = username.toLowerCase();

  for (let i = 1; i < data.length; i++) {
    const row       = data[i];
    const rowUser   = (row[col.username]  || '').toString().trim().toLowerCase();
    const rowHash   = (row[col.passHash]  || '').toString().trim().toLowerCase();
    const rowStatus = (row[col.status]    || 'active').toString().toLowerCase();

    if (rowUser !== cleanUser) continue;

    if (rowHash !== passwordHash.toLowerCase()) {
      return { success: false, message: 'Mật khẩu không chính xác.' };
    }
    if (rowStatus !== 'active') {
      return { success: false, message: 'Tài khoản đang bị khóa.' };
    }

    const nowStr = new Date().toISOString();
    if (col.lastLogin !== -1) sheet.getRange(i + 1, col.lastLogin + 1).setValue(nowStr);

    return {
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id:        row[col.id] || ('USR_' + i),
        username:  row[col.username],
        fullName:  row[col.fullName] || row[col.username],
        role:      row[col.role] || 'user',
        lastLogin: nowStr
      }
    };
  }
  return { success: false, message: 'Tài khoản không tồn tại trên hệ thống.' };
}

// ---- ĐĂNG KÝ (lưu hash) ----
function handleRegister(payload) {
  const username     = (payload.username     || '').toString().trim();
  const passwordHash = (payload.passwordHash || '').toString().trim();
  const fullName     = (payload.fullName     || username).toString().trim();
  const role         = payload.role || 'user';

  if (!username || !passwordHash) {
    return { success: false, message: 'Vui lòng điền tên đăng nhập và mật khẩu.' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { initDatabase(); sheet = ss.getSheetByName(SHEET_NAME); }

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const userCol = headers.indexOf('username');

  for (let i = 1; i < data.length; i++) {
    if ((data[i][userCol] || '').toString().toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
    }
  }

  const newId = 'USR_' + new Date().getTime();
  const now   = new Date().toISOString();
  sheet.appendRow([newId, username, passwordHash, fullName, role, 'active', now, '']);

  return {
    success: true,
    message: 'Đăng ký thành công!',
    user: { id: newId, username, fullName, role }
  };
}

// ---- HELPER ----
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
