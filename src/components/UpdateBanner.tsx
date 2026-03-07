import { useState, useEffect } from 'react';
import './UpdateBanner.css';

interface UpdateInfo {
  version: string;
  body: string | null;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [updateObj, setUpdateObj] = useState<any>(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setStatus('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        setUpdateInfo({ version: update.version, body: update.body ?? null });
        setUpdateObj(update);
        setStatus('available');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Update check failed:', err);
      setStatus('idle');
    }
  };

  const installUpdate = async () => {
    if (!updateObj) return;
    setStatus('downloading');

    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateObj.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setStatus('ready');
            break;
        }
      });

      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err) {
      console.error('Update install failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Update failed');
      setStatus('error');
    }
  };

  if (status === 'idle' || status === 'checking' || dismissed) return null;

  return (
    <div className={`update-banner ${status === 'error' ? 'update-banner-error' : ''}`}>
      <div className="update-banner-content">
        {status === 'available' && (
          <>
            <span className="update-banner-text">
              Version {updateInfo?.version} is available
            </span>
            <div className="update-banner-actions">
              <button className="btn btn-sm btn-primary" onClick={installUpdate}>
                Update Now
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setDismissed(true)}>
                Later
              </button>
            </div>
          </>
        )}
        {status === 'downloading' && (
          <>
            <span className="update-banner-text">
              Downloading update... {progress}%
            </span>
            <div className="update-progress-bar">
              <div className="update-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
        {status === 'ready' && (
          <span className="update-banner-text">
            Update installed. Restarting...
          </span>
        )}
        {status === 'error' && (
          <>
            <span className="update-banner-text">
              Update failed: {errorMsg}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => setDismissed(true)}>
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default UpdateBanner;
