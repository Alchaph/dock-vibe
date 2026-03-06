import { useState } from 'react';
import { dockerApi } from '../api';
import type { PullProgressEvent } from '../types';
import './PullImage.css';

interface PullImageProps {
  onClose: () => void;
  onSuccess: () => void;
}

function PullImage({ onClose, onSuccess }: PullImageProps) {
  const [imageName, setImageName] = useState('');
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [complete, setComplete] = useState(false);

  const handlePull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageName.trim()) {
      setError('Please enter an image name');
      return;
    }

    setPulling(true);
    setError(null);
    setStatus('Pulling...');
    setComplete(false);

    try {
      await dockerApi.pullImage(imageName.trim(), (event: PullProgressEvent) => {
        if (event.error) {
          setError(event.error);
          setStatus('');
          return;
        }
        if (event.complete) {
          setComplete(true);
          setStatus('Pull complete');
          return;
        }
        const layerPrefix = event.id ? `${event.id}: ` : '';
        setStatus(`${layerPrefix}${event.status}`);
      });

      setComplete(true);
      setStatus('Pull complete');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image');
      setPulling(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Pull Docker Image</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handlePull} className="pull-form">
          <div className="form-group">
            <label htmlFor="imageName">Image Name</label>
            <input
              type="text"
              id="imageName"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="e.g., nginx:latest, postgres:15, redis:alpine"
              className="form-input"
              disabled={pulling}
            />
            <p className="form-help">
              Enter the image name with optional tag (defaults to 'latest')
            </p>
          </div>

          {status && !error && (
            <div className="pull-status">{status.toUpperCase()}</div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              {complete ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pulling}
            >
              {pulling ? 'Pulling...' : 'Pull Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PullImage;
