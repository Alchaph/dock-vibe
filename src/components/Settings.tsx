import { useState, useEffect } from 'react';
import type { ToastType } from './Toast';
import './Settings.css';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  theme: 'metro' | 'realism';
  onChangeTheme: (theme: 'metro' | 'realism') => void;
  onToast: (type: ToastType, message: string) => void;
}

function Settings({ darkMode, onToggleDarkMode, theme, onChangeTheme, onToast }: SettingsProps) {
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('refreshInterval');
    return saved ? Number(saved) : 5;
  });
  const [showAllDefault, setShowAllDefault] = useState(() => {
    const saved = localStorage.getItem('showAllDefault');
    return saved ? JSON.parse(saved) : false;
  });
  const [confirmDestructive, setConfirmDestructive] = useState(() => {
    const saved = localStorage.getItem('confirmDestructive');
    return saved ? JSON.parse(saved) : true;
  });
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    import('@tauri-apps/api/app')
      .then((mod) => mod.getVersion())
      .then((v) => setAppVersion(v))
      .catch(() => { /* running in test/browser */ });
  }, []);

  const handleRefreshIntervalChange = (value: number) => {
    setRefreshInterval(value);
    localStorage.setItem('refreshInterval', String(value));
    window.dispatchEvent(new Event('refreshIntervalChanged'));
    onToast('success', `Refresh interval set to ${value}s`);
  };

  const handleShowAllDefaultChange = (value: boolean) => {
    setShowAllDefault(value);
    localStorage.setItem('showAllDefault', JSON.stringify(value));
    window.dispatchEvent(new Event('showAllDefaultChanged'));
    onToast('success', value ? 'Showing all containers by default' : 'Showing running containers by default');
  };

  const handleConfirmDestructiveChange = (value: boolean) => {
    setConfirmDestructive(value);
    localStorage.setItem('confirmDestructive', JSON.stringify(value));
    window.dispatchEvent(new Event('confirmDestructiveChanged'));
    onToast('success', value ? 'Confirmation dialogs enabled' : 'Confirmation dialogs disabled');
  };

  const handleThemeChange = (newTheme: 'metro' | 'realism') => {
    onChangeTheme(newTheme);
    onToast('success', newTheme === 'metro' ? 'Theme: Metro' : 'Theme: Graphic Realism');
  };

  return (
    <div className="settings-page">
      <div className="settings-section">
        <h2>Appearance</h2>
        <div className="setting-item">
          <div className="setting-info">
            <label>Theme</label>
            <p className="setting-description">Choose your visual style</p>
          </div>
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as 'metro' | 'realism')}
            className="setting-select"
          >
            <option value="metro">Metro</option>
            <option value="realism">Graphic Realism</option>
          </select>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <label>Dark Mode</label>
            <p className="setting-description">Switch between light and dark theme</p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`btn toggle-btn ${darkMode ? 'toggle-on' : 'toggle-off'}`}
          >
            {darkMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>General</h2>
        <div className="setting-item">
          <div className="setting-info">
            <label>Auto-refresh Interval</label>
            <p className="setting-description">How often to refresh container data (in seconds)</p>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
            className="setting-select"
          >
            <option value={2}>2s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
          </select>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <label>Show All Containers</label>
            <p className="setting-description">Show stopped containers by default</p>
          </div>
          <button
            onClick={() => handleShowAllDefaultChange(!showAllDefault)}
            className={`btn toggle-btn ${showAllDefault ? 'toggle-on' : 'toggle-off'}`}
          >
            {showAllDefault ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <label>Confirm Destructive Actions</label>
            <p className="setting-description">Show confirmation dialog before removing containers, images, volumes, and networks</p>
          </div>
          <button
            onClick={() => handleConfirmDestructiveChange(!confirmDestructive)}
            className={`btn toggle-btn ${confirmDestructive ? 'toggle-on' : 'toggle-off'}`}
          >
            {confirmDestructive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>About</h2>
        <div className="setting-item">
          <div className="setting-info">
            <label>Dock</label>
            <p className="setting-description">Modern cross-platform Docker GUI Manager</p>
          </div>
          <span className="setting-value">v{appVersion}</span>
        </div>
      </div>
    </div>
  );
}

export default Settings;
