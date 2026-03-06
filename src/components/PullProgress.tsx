import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { PullProgressEvent } from '../types';
import './PullProgress.css';

interface PullProgressProps {
  imageName: string;
  onClose: () => void;
  onStartPull?: () => void;
}

interface LayerProgress {
  id: string;
  status: string;
  current: number;
  total: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function PullProgress({ imageName, onClose, onStartPull }: PullProgressProps) {
  const [layers, setLayers] = useState<Map<string, LayerProgress>>(new Map());
  const [overallStatus, setOverallStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      unlistenFn = await listen<PullProgressEvent>('pull-progress', (event) => {
        const payload = event.payload;

        if (payload.image !== imageName) return;

        if (payload.error) {
          setError(payload.error);
          setIsComplete(true);
          setOverallStatus('Error');
          return;
        }

        if (payload.complete) {
          setIsComplete(true);
          setOverallStatus('Pull complete');
          return;
        }

        if (payload.id) {
          setLayers(prev => {
            const next = new Map(prev);
            const existing = next.get(payload.id!) || {
              id: payload.id!,
              status: '',
              current: 0,
              total: 0
            };

            existing.status = payload.status;
            if (payload.current !== null) existing.current = payload.current;
            if (payload.total !== null) existing.total = payload.total;

            next.set(payload.id!, existing);
            return next;
          });
        } else {
          setOverallStatus(payload.status);
        }
      });
    };

    setupListener().then(() => {
      if (onStartPull) {
        onStartPull();
      }
    });

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageName]);

  const layerList = Array.from(layers.values());

  let totalCurrent = 0;
  let totalSize = 0;
  for (const layer of layerList) {
    totalCurrent += layer.current;
    totalSize += layer.total;
  }

  const overallPercent = totalSize > 0 ? Math.min(100, (totalCurrent / totalSize) * 100) : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content pull-progress-modal">
        <div className="modal-header">
          <h2>PULLING: {imageName}</h2>
        </div>
        <div className="modal-body">
          <div className="overall-status-container">
            <div 
              className="status-text" 
              style={{ color: error ? 'var(--metro-red)' : isComplete ? 'var(--metro-green)' : 'var(--text-primary)' }}
            >
              {error ? `ERROR: ${error}` : overallStatus.toUpperCase()}
            </div>
            {!error && (
              <div className="progress-bar-container large">
                <div
                  className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            )}
            {!error && totalSize > 0 && (
              <div className="bytes-text">
                {formatBytes(totalCurrent)} / {formatBytes(totalSize)}
              </div>
            )}
          </div>

          <div className="layers-container">
            {layerList.map(layer => {
              const percent = layer.total > 0 ? Math.min(100, (layer.current / layer.total) * 100) : 0;
              const isLayerComplete = layer.status.toLowerCase().includes('complete') || layer.status.toLowerCase().includes('pull complete');
              return (
                <div key={layer.id} className="layer-row">
                  <div className="layer-info">
                    <span className="layer-id">{layer.id}</span>
                    <span className="layer-status">{layer.status.toUpperCase()}</span>
                  </div>
                  <div className="progress-bar-container small">
                    <div
                      className={`progress-bar-fill ${isLayerComplete ? 'complete' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="metro-button"
            onClick={onClose}
          >
            {isComplete || error ? 'CLOSE' : 'CANCEL'}
          </button>
        </div>
      </div>
    </div>
  );
}
