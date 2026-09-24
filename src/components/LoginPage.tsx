import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Database, 
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { loginWithGoogleScript, saveUser } from '../services/authService';
import type { User } from '../types';

interface LoginPageProps {
  scriptUrl: string;
  onLoginSuccess: (user: User) => void;
  onOpenSettings: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  scriptUrl,
  onLoginSuccess,
  onOpenSettings
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      const response = await loginWithGoogleScript(username.trim(), password, scriptUrl);

      if (response.success && response.user) {
        setSuccessNotice(response.message || 'Đăng nhập thành công!');
        if (rememberMe) {
          saveUser(response.user);
        }
        setTimeout(() => {
          onLoginSuccess(response.user!);
        }, 600);
      } else {
        setErrorMessage(response.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Lỗi: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="login-card-wrapper">
      {/* Background Decorative Glow */}
      <div className="card-ambient-glow" />

      <div className="login-card">
        {/* Card Header */}
        <div className="card-header">
          <div className="logo-badge">
            <Flame className="logo-flame" size={24} />
          </div>
          <h1 className="card-title">Đăng nhập tài khoản</h1>
          <p className="card-subtitle">
            Hệ thống xác thực dữ liệu qua <strong>Google Sheets & Apps Script</strong>
          </p>
        </div>

        {/* Status indicator bar */}
        <div className="connection-bar" onClick={onOpenSettings} title="Nhấn để thay đổi cấu hình">
          <div className="conn-left">
            <span className={`status-dot ${scriptUrl ? 'live' : 'mock'}`} />
            <span className="conn-label">
              {scriptUrl ? 'Đang kết nối: Google Sheet Database' : 'Đang dùng: Chế độ Demo (Offline)'}
            </span>
          </div>
          <button type="button" className="conn-action-btn">
            <Database size={13} />
            <span>Cấu hình</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert-box error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successNotice && (
          <div className="alert-box success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{successNotice}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Username */}
          <div className="form-field">
            <label htmlFor="username-input" className="field-label">
              Tên đăng nhập
            </label>
            <div className="field-input-group">
              <span className="input-icon">
                <UserIcon size={18} />
              </span>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                className="text-input"
                placeholder="Ví dụ: admin hoặc user"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="password-input" className="field-label">
                Mật khẩu
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  alert(
                    'Mẹo: Nếu dùng tài khoản mẫu, thử: admin / admin123 hoặc user / user123.\nNếu đã kết nối Google Sheet, bạn có thể xem trực tiếp mật khẩu trong sheet "Users"!'
                  );
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="field-input-group">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="text-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Options: Remember me */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-text">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập ngay</span>
                <ArrowRight size={18} className="arrow-icon" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Pills */}
        <div className="demo-accounts-section">
          <div className="demo-title">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Tài khoản mẫu có sẵn:</span>
          </div>
          <div className="demo-pills">
            <button
              type="button"
              className="pill-btn"
              onClick={() => handleFillDemo('admin', 'admin123')}
              title="Điền tự động admin / admin123"
            >
              <span className="pill-role">Admin:</span>
              <span className="pill-creds">admin / admin123</span>
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={() => handleFillDemo('user', 'user123')}
              title="Điền tự động user / user123"
            >
              <span className="pill-role">User:</span>
              <span className="pill-creds">user / user123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
