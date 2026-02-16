import { useState, useEffect } from 'react';
import { dockerApi } from '../api';
import type { NetworkDetails } from '../types';
import './NetworkList.css';

function NetworkList() {
  const [networks, setNetworks] = useState<NetworkDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDriver, setNewNetworkDriver] = useState('bridge');
  const [creating, setCreating] = useState(false);

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

  const handleRemoveNetwork = async (id: string, name: string) => {
    // Prevent removal of default networks
    if (['bridge', 'host', 'none'].includes(name)) {
      alert(`Cannot remove default Docker network "${name}"`);
      return;
    }

    if (!confirm(`Are you sure you want to remove network "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      await dockerApi.removeNetwork(id);
      await loadNetworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove network');
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
                  >
                    Remove
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
                ✕
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
    </div>
  );
}

export default NetworkList;
