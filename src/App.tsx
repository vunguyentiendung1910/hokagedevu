import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { ScriptModal } from './components/ScriptModal';
import { 
  getSavedScriptUrl, 
  saveScriptUrl, 
  getSavedUser, 
  saveUser 
} from './services/authService';
import type { User } from './types';
import { Flame, Code2, Database } from 'lucide-react';
import './App.css';

export function App() {
  const [user, setUser] = useState<User | null>(() => getSavedUser());
  const [scriptUrl, setScriptUrl] = useState<string>(() => getSavedScriptUrl());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    saveUser(null);
    setUser(null);
  };

  const handleSaveScriptUrl = (url: string) => {
    saveScriptUrl(url);
    setScriptUrl(url);
  };

  return (
    <div className="app-layout">
      {/* Background Animated Elements */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-grid-pattern" />

      {/* Navigation Header */}
      <header className="app-navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <Flame size={20} />
          </div>
          <span className="nav-title">Hokage<strong>Dev</strong></span>
          <span className="nav-badge">Vite + React + GAS</span>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="script-btn-trigger"
            onClick={() => setIsSettingsOpen(true)}
            title="Xem mã Google Apps Script và cấu hình URL"
          >
            <Database size={15} />
            <span>Google Apps Script</span>
            <span className={`nav-status-indicator ${scriptUrl ? 'online' : 'demo'}`} />
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="app-main">
        {user ? (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            scriptUrl={scriptUrl}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : (
          <LoginPage
            scriptUrl={scriptUrl}
            onLoginSuccess={handleLoginSuccess}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>Xác thực an toàn thông qua Google Apps Script Web App & Google Sheets</span>
          <button
            type="button"
            className="footer-link-btn"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Code2 size={13} />
            <span>Xem mã Google Script</span>
          </button>
        </div>
      </footer>

      {/* Google Apps Script Modal */}
      <ScriptModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        scriptUrl={scriptUrl}
        onSaveUrl={handleSaveScriptUrl}
      />
    </div>
  );
}

export default App;
