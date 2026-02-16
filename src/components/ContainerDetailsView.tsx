import { useState, useEffect } from 'react';
import type { ContainerDetails, ContainerStats } from '../types';
import { dockerApi } from '../api';
import './ContainerDetails.css';

interface ContainerDetailsViewProps {
  details: ContainerDetails;
  onAction: (action: string, id: string) => void;
}

const ContainerDetailsView = ({ details, onAction }: ContainerDetailsViewProps) => {
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (details.state.toLowerCase() !== 'running') {
        setStats(null);
        return;
      }

      try {
        const containerStats = await dockerApi.getContainerStats(details.id);
        setStats(containerStats);
        setStatsError(null);
      } catch (err) {
        setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [details.id, details.state]);

  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };
  return (
    <div className="container-details">
      <div className="details-header">
        <h2>{details.name}</h2>
        <div className="details-actions">
          <button
            onClick={() => onAction('start', details.id)}
            className="btn btn-success"
            disabled={details.state.toLowerCase() === 'running'}
          >
            Start
          </button>
          <button
            onClick={() => onAction('stop', details.id)}
            className="btn btn-warning"
            disabled={details.state.toLowerCase() !== 'running'}
          >
            Stop
          </button>
          <button
            onClick={() => onAction('restart', details.id)}
            className="btn btn-secondary"
          >
            Restart
          </button>
          <button
            onClick={() => onAction('remove', details.id)}
            className="btn btn-danger"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="details-grid">
        {stats && (
          <section className="details-section">
            <h3>Resource Usage</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <label>CPU Usage</label>
                <div className="stat-value">{stats.cpu_usage.toFixed(2)}%</div>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill cpu" 
                    style={{ width: `${Math.min(stats.cpu_usage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="stat-card">
                <label>Memory Usage</label>
                <div className="stat-value">
                  {formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)}
                </div>
                <div className="stat-bar">
                  <div 
                    className="stat-bar-fill memory" 
                    style={{ width: `${Math.min(stats.memory_percent, 100)}%` }}
                  />
                </div>
                <div className="stat-percent">{stats.memory_percent.toFixed(1)}%</div>
              </div>
              <div className="stat-card">
                <label>Network RX</label>
                <div className="stat-value">{formatBytes(stats.network_rx)}</div>
              </div>
              <div className="stat-card">
                <label>Network TX</label>
                <div className="stat-value">{formatBytes(stats.network_tx)}</div>
              </div>
            </div>
          </section>
        )}
        {statsError && details.state.toLowerCase() === 'running' && (
          <section className="details-section">
            <h3>Resource Usage</h3>
            <p className="text-muted">Unable to load resource statistics</p>
          </section>
        )}

        <section className="details-section">
          <h3>General Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Container ID:</label>
              <span>{details.id.substring(0, 12)}</span>
            </div>
            <div className="info-item">
              <label>Image:</label>
              <span>{details.image}</span>
            </div>
            <div className="info-item">
              <label>State:</label>
              <span className={`status-badge status-${details.state.toLowerCase()}`}>
                {details.state}
              </span>
            </div>
            <div className="info-item">
              <label>Created:</label>
              <span>{new Date(details.created).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="details-section">
          <h3>Port Mappings</h3>
          {details.ports.length > 0 ? (
            <table className="info-table">
              <thead>
                <tr>
                  <th>Container Port</th>
                  <th>Host Port</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {details.ports.map((port, idx) => (
                  <tr key={idx}>
                    <td>{port.private_port}</td>
                    <td>{port.public_port || '-'}</td>
                    <td>{port.port_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No port mappings</p>
          )}
        </section>

        <section className="details-section">
          <h3>Volume Mounts</h3>
          {details.mounts.length > 0 ? (
            <table className="info-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {details.mounts.map((mount, idx) => (
                  <tr key={idx}>
                    <td>{mount.mount_type}</td>
                    <td className="truncate">{mount.source}</td>
                    <td>{mount.destination}</td>
                    <td>{mount.rw ? 'rw' : 'ro'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No volume mounts</p>
          )}
        </section>

        <section className="details-section">
          <h3>Networks</h3>
          {Object.keys(details.network_settings.networks).length > 0 ? (
            <table className="info-table">
              <thead>
                <tr>
                  <th>Network</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details.network_settings.networks).map(([name, ip]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No networks</p>
          )}
        </section>

        <section className="details-section full-width">
          <h3>Environment Variables</h3>
          {details.env.length > 0 ? (
            <div className="env-list">
              {details.env.map((env, idx) => {
                const [key, ...valueParts] = env.split('=');
                const value = valueParts.join('=');
                return (
                  <div key={idx} className="env-item">
                    <code>
                      <span className="env-key">{key}</span>=
                      <span className="env-value">{value}</span>
                    </code>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted">No environment variables</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ContainerDetailsView;
