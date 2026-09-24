import type { AuthResponse, User } from '../types';

const STORAGE_KEY_URL = 'hokage_gas_url';
const STORAGE_KEY_USER = 'hokage_auth_user';

export const getSavedScriptUrl = (): string => {
  return 'https://script.google.com/macros/s/AKfycbx1vue6a_P-IEOUj4s4AyndZmGuXLAybcl7NFJUVBA69w3AmQS-lkpX0tWwV9gL_PGT/exec';
};

export const saveScriptUrl = (url: string): void => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
};

export const getSavedUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
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

/**
 * Kiểm tra kết nối tới Google Apps Script URL
 */
export const testGoogleScriptConnection = async (url: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'URL không hợp lệ. Phải có định dạng: https://script.google.com/macros/s/.../exec'
    };
  }

  const startTime = Date.now();
  try {
    // Gọi action ping qua GET
    const pingUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
    const response = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    if (data && data.success) {
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
      message: `Không thể kết nối (${errorMsg}). Hãy đảm bảo bạn đã chọn "Anyone" khi Deploy Web App.`
    };
  }
};

/**
 * Đăng nhập qua Google Apps Script Web App
 */
export const loginWithGoogleScript = async (
  username: string,
  password: string,
  customUrl?: string
): Promise<AuthResponse> => {
  const url = (customUrl || getSavedScriptUrl()).trim();

  // Nếu người dùng chưa cấu hình URL Google Script, dùng mock dữ liệu mẫu để trải nghiệm trước
  if (!url) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Hiệu ứng delay giả lập mạng
    if (username.toLowerCase() === 'admin' && password === 'admin123') {
      return {
        success: true,
        message: 'Đăng nhập thành công (Chế độ giả lập Demo)',
        user: {
          id: 'USR_DEMO_01',
          username: 'admin',
          fullName: 'Administrator (Demo)',
          role: 'admin',
          lastLogin: new Date().toISOString()
        }
      };
    }
    if (username.toLowerCase() === 'user' && password === 'user123') {
      return {
        success: true,
        message: 'Đăng nhập thành công (Chế độ giả lập Demo)',
        user: {
          id: 'USR_DEMO_02',
          username: 'user',
          fullName: 'Thành viên thử nghiệm (Demo)',
          role: 'user',
          lastLogin: new Date().toISOString()
        }
      };
    }
    return {
      success: false,
      message: 'Sai tài khoản hoặc mật khẩu (Thử admin / admin123 hoặc cấu hình Google Apps Script URL).'
    };
  }

  // Gửi request POST tới Google Apps Script
  // QUAN TRỌNG: Sử dụng 'text/plain;charset=utf-8' để Google Apps Script không bị lỗi preflight CORS OPTIONS!
  try {
    const payload = {
      action: 'login',
      username,
      password
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AuthResponse = await response.json();
    return result;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Lỗi kết nối tới Google Apps Script: ${errorMsg}. Kiểm tra lại quyền Deploy (Who has access: Anyone).`
    };
  }
};
