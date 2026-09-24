import React from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Clock, 
  Database, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';
import type { User } from '../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  scriptUrl: string;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  scriptUrl,
  onOpenSettings
}) => {
  const isConnected = !!scriptUrl;

  return (
    <div className="dashboard-container">
      <div className="dashboard-glow" />
      
      <div className="dashboard-card">
        {/* Top Header */}
        <div className="dashboard-header">
          <div className="brand-badge">
            <span className="brand-dot" />
            <span>Hokage Dev System</span>
          </div>
          <button
            className="settings-trigger-btn"
            onClick={onOpenSettings}
            title="Cấu hình Google Script"
          >
            <SlidersHorizontal size={16} />
            <span>Cấu hình DB</span>
          </button>
        </div>

        {/* User Hero Section */}
        <div className="user-hero">
          <div className="avatar-wrapper">
            <div className="avatar-circle">
              <UserIcon size={36} className="avatar-icon" />
            </div>
            <span className="online-indicator" />
          </div>

          <div className="user-meta">
            <div className="role-tag-row">
              <span className={`role-badge ${user.role}`}>
                <ShieldCheck size={14} />
                {user.role === 'admin' ? 'Administrator' : 'Thành viên'}
              </span>
              <span className="id-badge">ID: {user.id}</span>
            </div>
            <h2 className="user-fullname">{user.fullName || user.username}</h2>
            <p className="user-username">@{user.username}</p>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="status-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <Database size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Cơ sở dữ liệu</span>
              <span className="metric-value">
                {isConnected ? 'Google Sheets (Live)' : 'Chế độ Demo (Offline)'}
              </span>
            </div>
            <span className={`status-pill ${isConnected ? 'online' : 'demo'}`}>
              {isConnected ? 'Đã kết nối' : 'Demo'}
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock size={18} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Lần đăng nhập cuối</span>
              <span className="metric-value">
                {user.lastLogin 
                  ? new Date(user.lastLogin).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Vừa xong'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="dashboard-actions">
          <div className="tip-row">
            <Sparkles size={16} className="sparkle-icon" />
            <span>Tài khoản được xác thực và bảo mật qua Google Apps Script Web App.</span>
          </div>

          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};
