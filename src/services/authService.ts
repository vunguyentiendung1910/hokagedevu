import type { AuthResponse, User } from '../types';

const STORAGE_KEY_URL  = 'hokage_gas_url';
const STORAGE_KEY_USER = 'hokage_auth_user';

// ============================================================
// 🔐 MÃ HÓA MẬT KHẨU SHA-256 (Web Crypto API - phía client)
// ============================================================

/**
 * Tính SHA-256 hash của một chuỗi văn bản, trả về chuỗi hex chữ thường.
 * Mật khẩu gốc KHÔNG BAO GIỜ được gửi lên server.
 */
export const hashPasswordSHA256 = async (plainText: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// ============================================================
// 🗄️ PERSISTENCE (localStorage)
// ============================================================

export const getSavedScriptUrl = (): string => {
  return (
    localStorage.getItem(STORAGE_KEY_URL) ||
    (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
    ''
  );
};

export const saveScriptUrl = (url: string): void => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
};

export const getSavedUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const saveUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
};

// ============================================================
// 📡 KIỂM TRA KẾT NỐI
// ============================================================

/**
 * Kiểm tra kết nối tới Google Apps Script URL bằng cách gọi action ping.
 */
export const testGoogleScriptConnection = async (
  url: string
): Promise<{ success: boolean; message: string; latency?: number }> => {
  if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'URL không hợp lệ. Phải có định dạng: https://script.google.com/macros/s/.../exec'
    };
  }

  const startTime = Date.now();
  try {
    const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
    const response = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    if (data?.success) {
      return {
        success: true,
        message: data.message || 'Kết nối thành công tới Google Apps Script!',
        latency
      };
    }

    return {
      success: false,
      message: data?.message || 'Phản hồi không như mong đợi từ Apps Script.'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Không thể kết nối (${errorMsg}). Đảm bảo bạn đã chọn "Anyone" khi Deploy Web App.`
    };
  }
};

// ============================================================
// 🔑 ĐĂNG NHẬP
// ============================================================

/**
 * Đăng nhập qua Google Apps Script Web App.
 * Mật khẩu được HASH SHA-256 ngay tại client trước khi gửi —
 * server chỉ nhận và so sánh hash, không bao giờ thấy mật khẩu gốc.
 */
export const loginWithGoogleScript = async (
  username: string,
  password: string,
  customUrl?: string
): Promise<AuthResponse> => {
  const url = (customUrl || getSavedScriptUrl()).trim();

  // Tính hash ngay tại client trước khi gửi bất kỳ request nào
  const passwordHash = await hashPasswordSHA256(password);

  // Nếu chưa cấu hình URL → chế độ Demo offline (so sánh với hash cố định)
  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const adminHash  = await hashPasswordSHA256('admin123');
    const memberHash = await hashPasswordSHA256('user123');

    if (username.toLowerCase() === 'admin' && passwordHash === adminHash) {
      return {
        success: true,
        message: 'Đăng nhập thành công (Chế độ Demo)',
        user: {
          id:        'USR_DEMO_01',
          username:  'admin',
          fullName:  'Administrator (Demo)',
          role:      'admin',
          lastLogin: new Date().toISOString()
        }
      };
    }
    if (username.toLowerCase() === 'user' && passwordHash === memberHash) {
      return {
        success: true,
        message: 'Đăng nhập thành công (Chế độ Demo)',
        user: {
          id:        'USR_DEMO_02',
          username:  'user',
          fullName:  'Thành viên thử nghiệm (Demo)',
          role:      'user',
          lastLogin: new Date().toISOString()
        }
      };
    }
    return {
      success: false,
      message: 'Sai tài khoản hoặc mật khẩu (Thử admin / admin123 hoặc cấu hình Google Apps Script URL).'
    };
  }

  // Gửi hash (KHÔNG gửi plaintext) tới Google Apps Script
  // Dùng Content-Type: text/plain để tránh lỗi CORS preflight OPTIONS
  try {
    const payload = {
      action:       'login',
      username:     username.trim(),
      passwordHash              // ← chỉ gửi hash
    };

    const response = await fetch(url, {
      method:  'POST',
      mode:    'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json() as AuthResponse;
    return result;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Lỗi kết nối tới Google Apps Script: ${errorMsg}. Kiểm tra lại quyền Deploy (Who has access: Anyone).`
    };
  }
};
