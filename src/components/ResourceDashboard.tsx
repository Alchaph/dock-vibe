import { useState, useEffect, useCallback } from 'react';
import { dockerApi } from '../api';
import type { ContainerStatsEntry } from '../types';
import './ResourceDashboard.css';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getProgressColor = (percent: number) => {
  if (percent < 50) return 'var(--metro-green)';
  if (percent <= 80) return 'var(--metro-orange)';
  return 'var(--metro-red)';
};

const ResourceDashboard = () => {
  const [stats, setStats] = useState<ContainerStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      const data = await dockerApi.getAllContainerStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  if (isLoading && stats.length === 0) {
    return <div className="dashboard-loading">LOADING RESOURCE STATISTICS...</div>;
  }

  if (error && stats.length === 0) {
    return (
      <div className="dashboard-error">
        <p>ERROR: {error.toUpperCase()}</p>
        <button className="dashboard-retry-btn" onClick={() => fetchData()}>RETRY</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">RESOURCE USAGE</h2>
        <div className="dashboard-summary">
          RUNNING CONTAINERS: <span className="dashboard-count">{stats.length}</span>
        </div>
      </div>

      {stats.length === 0 && !isLoading ? (
        <div className="dashboard-empty">NO RUNNING CONTAINERS DETECTED</div>
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>CONTAINER</th>
                <th>CPU USAGE</th>
                <th>MEMORY USAGE</th>
                <th>NETWORK (RX / TX)</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.id}>
                  <td className="dashboard-cell-name">
                    <div className="dashboard-container-name">{stat.name}</div>
                    <div className="dashboard-container-image">{stat.image}</div>
                  </td>
                  <td className="dashboard-cell-cpu">
                    <div className="dashboard-stat-text">{stat.cpu_usage.toFixed(2)}%</div>
                    <div className="dashboard-progress-container">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${Math.min(stat.cpu_usage, 100)}%`,
                          backgroundColor: getProgressColor(stat.cpu_usage)
                        }}
                      />
                    </div>
                  </td>
                  <td className="dashboard-cell-memory">
                    <div className="dashboard-stat-text">
                      {formatBytes(stat.memory_usage)} / {formatBytes(stat.memory_limit)} ({stat.memory_percent.toFixed(2)}%)
                    </div>
                    <div className="dashboard-progress-container">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${Math.min(stat.memory_percent, 100)}%`,
                          backgroundColor: getProgressColor(stat.memory_percent)
                        }}
                      />
                    </div>
                  </td>
                  <td className="dashboard-cell-network">
                    <div className="dashboard-network-stats">
                      <span className="dashboard-rx">RX: {formatBytes(stat.network_rx)}</span>
                      <span className="dashboard-tx">TX: {formatBytes(stat.network_tx)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResourceDashboard;