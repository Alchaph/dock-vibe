import { useState } from 'react';
import { dockerApi } from '../api';
import type { PruneResult } from '../types';
import './SystemPrune.css';

interface SystemPruneProps {
  onClose: () => void;
  onPruned: () => void;
}

function SystemPrune({ onClose, onPruned }: SystemPruneProps) {
  const [pruneVolumes, setPruneVolumes] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PruneResult | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePrune = async () => {
    setPruning(true);
    setError(null);

    try {
      const pruneResult = await dockerApi.systemPrune(pruneVolumes);
      setResult(pruneResult);
      onPruned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prune system');
    } finally {
      setPruning(false);
    }
  };

  const totalRemoved = result
    ? result.containers_removed + result.images_removed + result.volumes_removed + result.networks_removed
    : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>System Prune</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="prune-body">
          {!result ? (
            <>
              <p className="prune-warning">
                This will remove all stopped containers, unused networks, dangling images, and build cache.
              </p>

              <label className="checkbox-label prune-option">
                <input
                  type="checkbox"
                  checked={pruneVolumes}
                  onChange={(e) => setPruneVolumes(e.target.checked)}
                  disabled={pruning}
                />
                Also prune unused volumes
              </label>

              {pruneVolumes && (
                <p className="prune-volume-warning">
                  Volume data will be permanently deleted and cannot be recovered.
                </p>
              )}

              {error && (
                <div className="error-message">{error}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={pruning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePrune}
                  className="btn btn-danger"
                  disabled={pruning}
                >
                  {pruning ? 'Pruning...' : 'Prune'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="prune-results">
                <div className="prune-summary">
                  <span className="prune-summary-count">{totalRemoved}</span>
                  <span className="prune-summary-label">items removed</span>
                  <span className="prune-summary-space">{formatBytes(result.space_reclaimed)} reclaimed</span>
                </div>

                <table className="prune-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Removed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Containers</td>
                      <td>{result.containers_removed}</td>
                    </tr>
                    <tr>
                      <td>Images</td>
                      <td>{result.images_removed}</td>
                    </tr>
                    {pruneVolumes && (
                      <tr>
                        <td>Volumes</td>
                        <td>{result.volumes_removed}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Networks</td>
                      <td>{result.networks_removed}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemPrune;
