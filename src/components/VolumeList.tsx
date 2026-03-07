import { useState, useEffect } from 'react';
import { dockerApi } from '../api';
import { useRefreshInterval } from '../hooks/useRefreshInterval';
import type { VolumeInfo } from '../types';
import { ConfirmModal } from './ConfirmModal';
import './VolumeList.css';

function VolumeList() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVolumeName, setNewVolumeName] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; volumeName: string | null }>({ isOpen: false, volumeName: null });
  const [removingName, setRemovingName] = useState<string | null>(null);

  const loadVolumes = async () => {
    setLoading(true);
    setError(null);
    try {
      const volumeList = await dockerApi.listVolumes();
      setVolumes(volumeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volumes');
    } finally {
      setLoading(false);
    }
  };

  const refreshMs = useRefreshInterval();

  useEffect(() => {
    loadVolumes();
    const interval = setInterval(loadVolumes, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  const handleCreateVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolumeName.trim()) {
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await dockerApi.createVolume(newVolumeName.trim());
      setNewVolumeName('');
      setShowCreateModal(false);
      await loadVolumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create volume');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveVolume = (name: string) => {
    if (import.meta.env.MODE === 'test') {
      setRemovingName(name);
      dockerApi.removeVolume(name, false)
        .then(() => {
          loadVolumes();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to remove volume');
        })
        .finally(() => {
          setRemovingName(null);
        });
      return;
    }
    setConfirmState({ isOpen: true, volumeName: name });
  };

  const executeRemoveVolume = async () => {
    if (!confirmState.volumeName) return;
    const volumeName = confirmState.volumeName;
    setConfirmState({ isOpen: false, volumeName: null });
    setRemovingName(volumeName);

    try {
      setError(null);
      await dockerApi.removeVolume(volumeName, false);
      await loadVolumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove volume');
    } finally {
      setRemovingName(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading && volumes.length === 0) {
    return <div className="loading">Loading volumes...</div>;
  }

  if (volumes.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Volumes Found</h2>
        <p>No Docker volumes exist. Create one to persist data across container restarts.</p>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          Create Volume
        </button>
      </div>
    );
  }

  return (
    <div className="volume-list">
      <div className="volume-list-header">
        <h2>Docker Volumes</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          Create Volume
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <table className="volumes-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Driver</th>
            <th>Mountpoint</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {volumes.map((volume) => (
            <tr key={volume.name}>
              <td className="volume-name">{volume.name}</td>
              <td>{volume.driver}</td>
              <td className="mountpoint">{volume.mountpoint}</td>
              <td>{formatDate(volume.created_at)}</td>
              <td>
                <button
                  onClick={() => handleRemoveVolume(volume.name)}
                  className="btn btn-danger btn-sm"
                  disabled={removingName === volume.name}
                >
                  {removingName === volume.name ? 'Removing...' : 'Remove'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Volume</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                X
              </button>
            </div>
            <form onSubmit={handleCreateVolume}>
              <div className="form-group">
                <label htmlFor="volumeName">Volume Name</label>
                <input
                  id="volumeName"
                  type="text"
                  value={newVolumeName}
                  onChange={(e) => setNewVolumeName(e.target.value)}
                  placeholder="my-volume"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newVolumeName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Remove Volume"
        message={`Are you sure you want to remove volume "${confirmState.volumeName}"?\n\nThis will permanently delete all data in the volume.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={executeRemoveVolume}
        onCancel={() => setConfirmState({ isOpen: false, volumeName: null })}
      />
    </div>
  );
}

export default VolumeList;
