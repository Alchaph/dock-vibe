import { useState, useMemo } from 'react';
import type { ContainerInfo } from '../types';
import './ContainerList.css';

interface ContainerListProps {
  containers: ContainerInfo[];
  onAction: (action: string, id: string) => void;
  onViewDetails: (id: string) => void;
  onViewLogs: (id: string) => void;
  loading: boolean;
}

const ContainerList = ({ containers, onAction, onViewDetails, onViewLogs, loading }: ContainerListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'running':
        return 'status-running';
      case 'exited':
        return 'status-stopped';
      case 'paused':
        return 'status-paused';
      default:
        return 'status-unknown';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Filter containers based on search term
  const filteredContainers = useMemo(() => {
    if (!searchTerm.trim()) return containers;
    
    const term = searchTerm.toLowerCase();
    return containers.filter(container => 
      container.name?.toLowerCase().includes(term) ||
      container.image.toLowerCase().includes(term) ||
      container.id.toLowerCase().includes(term) ||
      container.state.toLowerCase().includes(term)
    );
  }, [containers, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = containers.length;
    const running = containers.filter(c => c.state.toLowerCase() === 'running').length;
    const stopped = containers.filter(c => c.state.toLowerCase() === 'exited').length;
    const paused = containers.filter(c => c.state.toLowerCase() === 'paused').length;
    return { total, running, stopped, paused };
  }, [containers]);

  if (loading && containers.length === 0) {
    return <div className="loading">Loading containers...</div>;
  }

  if (containers.length === 0) {
    return (
      <div className="empty-state">
        <h2>No containers found</h2>
        <p>Start by pulling an image and creating a container, or enable "Show all containers" to see stopped containers.</p>
      </div>
    );
  }

  return (
    <div className="container-list">
      {/* Stats bar */}
      <div className="container-stats">
        <div className="stat-card stat-total">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card stat-running">
          <div className="stat-value">{stats.running}</div>
          <div className="stat-label">Running</div>
        </div>
        <div className="stat-card stat-stopped">
          <div className="stat-value">{stats.stopped}</div>
          <div className="stat-label">Stopped</div>
        </div>
        {stats.paused > 0 && (
          <div className="stat-card stat-paused">
            <div className="stat-value">{stats.paused}</div>
            <div className="stat-label">Paused</div>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search containers by name, image, ID, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="clear-search"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {filteredContainers.length === 0 ? (
        <div className="empty-state">
          <h3>No containers match your search</h3>
          <p>Try a different search term or clear the filter</p>
        </div>
      ) : (
        <table className="containers-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Name</th>
            <th>Image</th>
            <th>State</th>
            <th>Ports</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredContainers.map((container) => (
            <tr key={container.id}>
              <td>
                <span className={`status-indicator ${getStatusColor(container.state)}`}></span>
              </td>
              <td>
                <button 
                  onClick={() => onViewDetails(container.id)}
                  className="link-button"
                >
                  {container.name || container.id.substring(0, 12)}
                </button>
              </td>
              <td className="image-cell">{container.image}</td>
              <td>
                <span className={`status-badge ${getStatusColor(container.state)}`}>
                  {container.state}
                </span>
              </td>
              <td className="ports-cell">
                {container.ports.length > 0 ? (
                  <div className="ports-list">
                    {container.ports.slice(0, 2).map((port, idx) => (
                      <span key={idx} className="port-badge">
                        {port.public_port ? `${port.public_port}:${port.private_port}` : port.private_port}
                      </span>
                    ))}
                    {container.ports.length > 2 && (
                      <span className="port-badge">+{container.ports.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td className="date-cell">{formatDate(container.created)}</td>
              <td>
                <div className="action-buttons">
                  {container.state.toLowerCase() === 'running' && (
                    <>
                      <button
                        onClick={() => onAction('stop', container.id)}
                        className="btn btn-sm btn-warning"
                        title="Stop"
                      >
                        Stop
                      </button>
                      <button
                        onClick={() => onAction('restart', container.id)}
                        className="btn btn-sm btn-secondary"
                        title="Restart"
                      >
                        Restart
                      </button>
                      <button
                        onClick={() => onViewLogs(container.id)}
                        className="btn btn-sm btn-info"
                        title="Logs"
                      >
                        Logs
                      </button>
                    </>
                  )}
                  {container.state.toLowerCase() === 'exited' && (
                    <>
                      <button
                        onClick={() => onAction('start', container.id)}
                        className="btn btn-sm btn-success"
                        title="Start"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => onAction('remove', container.id)}
                        className="btn btn-sm btn-danger"
                        title="Remove"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {container.state.toLowerCase() === 'paused' && (
                    <button
                      onClick={() => onAction('unpause', container.id)}
                      className="btn btn-sm btn-primary"
                      title="Unpause"
                    >
                      Unpause
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
};

export default ContainerList;
