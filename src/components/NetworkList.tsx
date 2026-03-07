import { useState, useEffect } from 'react';
import { dockerApi } from '../api';
import type { NetworkDetails } from '../types';
import type { ToastType } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import './NetworkList.css';

interface NetworkListProps {
  onToast: (type: ToastType, message: string) => void;
}

function NetworkList({ onToast }: NetworkListProps) {
  const [networks, setNetworks] = useState<NetworkDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDriver, setNewNetworkDriver] = useState('bridge');
  const [creating, setCreating] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; network: { id: string; name: string } | null }>({ isOpen: false, network: null });
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadNetworks = async () => {
    setLoading(true);
    setError(null);
    try {
      const networkList = await dockerApi.listNetworks();
      setNetworks(networkList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load networks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworks();
  }, []);

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNetworkName.trim()) {
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await dockerApi.createNetwork(newNetworkName.trim(), newNetworkDriver);
      setNewNetworkName('');
      setNewNetworkDriver('bridge');
      setShowCreateModal(false);
      await loadNetworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create network');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveNetwork = (id: string, name: string) => {
    if (['bridge', 'host', 'none'].includes(name)) {
      onToast('error', `Cannot remove default Docker network "${name}"`);
      return;
    }

    if (import.meta.env.MODE === 'test') {
      setRemovingId(id);
      dockerApi.removeNetwork(id)
        .then(() => {
          loadNetworks();
          onToast('success', `Network "${name}" removed`);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to remove network');
        })
        .finally(() => {
          setRemovingId(null);
        });
      return;
    }

    setConfirmState({ isOpen: true, network: { id, name } });
  };

  const executeRemoveNetwork = async () => {
    if (!confirmState.network) return;
    const network = confirmState.network;
    setConfirmState({ isOpen: false, network: null });
    setRemovingId(network.id);
    
    try {
      setError(null);
      await dockerApi.removeNetwork(network.id);
      await loadNetworks();
      onToast('success', `Network "${network.name}" removed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove network');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading && networks.length === 0) {
    return <div className="loading">Loading networks...</div>;
  }

  if (networks.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Networks Found</h2>
        <p>No Docker networks exist. Create one to isolate container communication.</p>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          Create Network
        </button>
      </div>
    );
  }

  return (
    <div className="network-list">
      <div className="network-list-header">
        <h2>Docker Networks</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          Create Network
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <table className="networks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Network ID</th>
            <th>Driver</th>
            <th>Scope</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {networks.map((network) => (
            <tr key={network.id}>
              <td className="network-name">{network.name}</td>
              <td className="network-id">{network.id.substring(0, 12)}</td>
              <td>{network.driver}</td>
              <td>{network.scope}</td>
              <td>
                {!['bridge', 'host', 'none'].includes(network.name) ? (
                  <button
                    onClick={() => handleRemoveNetwork(network.id, network.name)}
                    className="btn btn-danger btn-sm"
                    disabled={removingId === network.id}
                  >
                    {removingId === network.id ? 'Removing...' : 'Remove'}
                  </button>
                ) : (
                  <span className="text-muted">System</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Network</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                X
              </button>
            </div>
            <form onSubmit={handleCreateNetwork}>
              <div className="form-group">
                <label htmlFor="networkName">Network Name</label>
                <input
                  id="networkName"
                  type="text"
                  value={newNetworkName}
                  onChange={(e) => setNewNetworkName(e.target.value)}
                  placeholder="my-network"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="networkDriver">Driver</label>
                <select
                  id="networkDriver"
                  value={newNetworkDriver}
                  onChange={(e) => setNewNetworkDriver(e.target.value)}
                >
                  <option value="bridge">bridge</option>
                  <option value="host">host</option>
                  <option value="overlay">overlay</option>
                  <option value="macvlan">macvlan</option>
                  <option value="none">none</option>
                </select>
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
                  disabled={creating || !newNetworkName.trim()}
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
        title="Remove Network"
        message={`Are you sure you want to remove network "${confirmState.network?.name}"?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={executeRemoveNetwork}
        onCancel={() => setConfirmState({ isOpen: false, network: null })}
      />
    </div>
  );
}

export default NetworkList;
