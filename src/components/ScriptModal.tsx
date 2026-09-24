import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Terminal, 
  Settings, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../constants/appscriptCode';
import { testGoogleScriptConnection } from '../services/authService';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptUrl: string;
  onSaveUrl: (url: string) => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  isOpen,
  onClose,
  scriptUrl,
  onSaveUrl
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'guide'>('config');
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleSave = () => {
    onSaveUrl(urlInput.trim());
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập Web App URL trước khi kiểm tra.'
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testGoogleScriptConnection(urlInput.trim());
    setTestResult(res);
    setTesting(false);
    if (res.success) {
      onSaveUrl(urlInput.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Terminal size={18} />
            </div>
            <div>
              <h3>Cấu hình & Mã Google Apps Script</h3>
              <p>Quản lý kết nối cơ sở dữ liệu Google Sheets của bạn</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={16} />
            <span>Kết nối Web App</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            <Terminal size={16} />
            <span>Mã nguồn Code.gs</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={16} />
            <span>Hướng dẫn 5 bước</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'config' && (
            <div className="config-pane">
              <div className="info-card">
                <p>
                  Dán đường dẫn <strong>Web App URL</strong> được Google cấp sau khi Deploy Apps Script để kết nối trực tiếp với Google Sheets của bạn.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="gas-url">Google Apps Script Web App URL</label>
                <div className="input-url-wrapper">
                  <input
                    id="gas-url"
                    type="url"
                    className="styled-input"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setTestResult(null);
                    }}
                  />
                </div>
                <span className="field-hint">
                  Đường link kết thúc bằng <code>/exec</code> (không dùng <code>/dev</code>)
                </span>
              </div>

              {testResult && (
                <div className={`test-feedback-box ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.success ? (
                    <CheckCircle2 size={18} className="status-icon" />
                  ) : (
                    <AlertCircle size={18} className="status-icon" />
                  )}
                  <div className="test-feedback-text">
                    <p className="test-feedback-title">
                      {testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại'}
                    </p>
                    <p className="test-feedback-desc">{testResult.message}</p>
                    {testResult.latency !== undefined && (
                      <span className="latency-badge">Độ trễ: {testResult.latency}ms</span>
                    )}
                  </div>
                </div>
              )}

              <div className="config-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>Đang ping API...</span>
                    </>
                  ) : (
                    <span>Kiểm tra kết nối</span>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                >
                  Lưu cấu hình
                </button>
              </div>

              <div className="tip-box">
                <span className="tip-tag">Ghi nhớ</span>
                <p>
                  Nếu chưa kịp deploy Google Apps Script, hệ thống có sẵn chế độ giả lập cho 2 tài khoản mẫu:
                  <code>admin / admin123</code> và <code>user / user123</code> để bạn thử nghiệm giao diện ngay.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="code-pane">
              <div className="code-pane-toolbar">
                <div className="file-info">
                  <span className="file-name">Code.gs</span>
                  <span className="file-desc">Copy toàn bộ đoạn mã này vào Apps Script của Google Sheets</span>
                </div>
                <button
                  className={`copy-code-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyCode}
                  title="Sao chép toàn bộ mã"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Sao chép mã</span>
                    </>
                  )}
                </button>
              </div>

              <div className="code-editor-viewport">
                <pre>
                  <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="guide-pane">
              <div className="guide-steps">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Tạo Google Sheet</h4>
                    <p>
                      Mở <a href="https://sheets.google.com" target="_blank" rel="noreferrer">Google Sheets <ExternalLink size={12} /></a> và tạo 1 file bảng tính mới (đặt tên tùy ý, ví dụ: <code>HokageAuthDB</code>).
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Mở Apps Script</h4>
                    <p>
                      Trên thanh công cụ của Sheet, chọn: <strong>Tiện ích mở rộng (Extensions)</strong> → <strong>Apps Script</strong>.
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Dán mã nguồn</h4>
                    <p>
                      Chuyển sang tab <strong>Mã nguồn Code.gs</strong> ở trên, bấm <strong>Sao chép mã</strong> rồi dán đè vào trình soạn thảo Google Apps Script. Sau đó bấm nút <strong>Lưu (Ctrl + S)</strong>.
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Chạy khởi tạo bảng (Tùy chọn)</h4>
                    <p>
                      Chọn hàm <code>initDatabase</code> trên thanh công cụ và bấm <strong>Chạy (Run)</strong>. Cấp quyền truy cập nếu Google yêu cầu. Bảng <code>Users</code> và 2 tài khoản mẫu sẽ được tự động tạo.
                    </p>
                  </div>
                </div>

                <div className="step-item highlight">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>Triển khai Web App (Quan trọng nhất)</h4>
                    <p>
                      Bấm <strong>Triển khai (Deploy)</strong> → <strong>Triển khai mới (New deployment)</strong>:
                    </p>
                    <ul className="guide-checklist">
                      <li>Loại: <strong>Ứng dụng web (Web app)</strong></li>
                      <li>Thực thi dưới dạng: <strong>Tôi (Me)</strong></li>
                      <li>
                        Ai có quyền truy cập: <strong className="text-warning">Bất kỳ ai (Anyone)</strong> 
                        <br />
                        <small>*(Bắt buộc chọn "Anyone" để web React có thể gọi API mà không bị chặn)*</small>
                      </li>
                    </ul>
                    <p>
                      Copy URL dạng <code>https://script.google.com/macros/s/.../exec</code> và dán vào tab <strong>Kết nối Web App</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
