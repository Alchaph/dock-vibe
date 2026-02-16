import { useState, useEffect, useRef } from 'react';
import { dockerApi } from '../api';
import './LogsView.css';

interface LogsViewProps {
  containerId: string;
}

const LogsView = ({ containerId }: LogsViewProps) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tailLines, setTailLines] = useState('100');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const containerLogs = await dockerApi.getContainerLogs(containerId, tailLines);
      setLogs(containerLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, tailLines]);

  // Filter logs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const lines = logs.split('\n');
    const filtered = lines.filter(line => 
      line.toLowerCase().includes(searchTerm.toLowerCase())
    ).join('\n');
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    logsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRawLogs = () => {
    // Create HTML content with the logs
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Container Logs - ${containerId.substring(0, 12)}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #1E1E1E;
      color: #D4D4D4;
      font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <pre>${logs.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    // Clean up the URL after a short delay
    if (newWindow) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      // Fallback: create downloadable file
      const link = document.createElement('a');
      link.href = url;
      link.download = `container-logs-${containerId.substring(0, 12)}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(filteredLogs || logs);
      alert('Logs copied to clipboard!');
    } catch (err) {
      alert('Failed to copy logs');
    }
  };

  const highlightSearch = (text: string): string => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="logs-view">
      <div className="logs-header">
        <h2>Container Logs</h2>
        <div className="logs-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="clear-search-btn"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <label className="tail-label">
            Lines:
            <select 
              value={tailLines} 
              onChange={(e) => setTailLines(e.target.value)}
              className="tail-select"
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="all">All</option>
            </select>
          </label>
          <button onClick={scrollToTop} className="btn btn-secondary btn-sm" title="Scroll to top">
            Up
          </button>
          <button onClick={scrollToBottom} className="btn btn-secondary btn-sm" title="Scroll to bottom">
            Down
          </button>
          <button onClick={copyLogs} className="btn btn-info btn-sm" title="Copy logs">
            Copy
          </button>
          <button onClick={openRawLogs} className="btn btn-info btn-sm" title="Open in browser">
            Open Raw
          </button>
          <button onClick={loadLogs} className="btn btn-primary" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {searchTerm && (
        <div className="search-info">
          Searching for: <strong>{searchTerm}</strong>
          {filteredLogs ? ` (${filteredLogs.split('\n').filter(l => l).length} matches)` : ' (no matches)'}
        </div>
      )}

      <div className="logs-container" ref={logsContainerRef}>
        {searchTerm ? (
          <pre 
            className="logs-content"
            dangerouslySetInnerHTML={{ 
              __html: highlightSearch(filteredLogs || 'No matching logs found') 
            }}
          />
        ) : (
          <pre className="logs-content">
            {logs || 'No logs available'}
          </pre>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LogsView;
