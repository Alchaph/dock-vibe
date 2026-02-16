import React, { useState } from 'react';
import { dockerApi } from '../api';
import type { ComposeDeployResult } from '../types';
import './ComposeUpload.css';

interface ComposeUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ComposeUpload: React.FC<ComposeUploadProps> = ({ onClose, onSuccess }) => {
  const [yamlContent, setYamlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [deployResults, setDeployResults] = useState<ComposeDeployResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deployed, setDeployed] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setYamlContent(content);
        setError(null);
        setDeployed(false);
        setDeployResults([]);
      };
      reader.readAsText(file);
    }
  };

  const handleDeploy = async () => {
    if (!yamlContent.trim()) {
      setError('Please upload a compose file first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const results = await dockerApi.deployCompose(yamlContent);
      setDeployResults(results);
      setDeployed(true);
      
      const hasErrors = results.some(r => !r.success);
      if (!hasErrors) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy compose file');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAll = async () => {
    setLoading(true);
    try {
      // Start all successfully created containers
      for (const result of deployResults) {
        if (result.success && result.container_id) {
          try {
            await dockerApi.startContainer(result.container_id);
          } catch (err) {
            console.error(`Failed to start ${result.service_name}:`, err);
          }
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start containers');
    } finally {
      setLoading(false);
    }
  };

  const successCount = deployResults.filter(r => r.success).length;
  const failureCount = deployResults.filter(r => !r.success).length;

  return (
    <div className="compose-upload-overlay">
      <div className="compose-upload-modal">
        <div className="compose-upload-header">
          <h2>Deploy Docker Compose</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="compose-upload-body">
          {!deployed ? (
            <>
              <div className="file-upload-section">
                <label htmlFor="compose-file" className="file-upload-label">
                  Select compose.yml or docker-compose.yml
                </label>
                <input
                  type="file"
                  id="compose-file"
                  accept=".yml,.yaml"
                  onChange={handleFileUpload}
                  className="file-input"
                />
              </div>

              {yamlContent && (
                <div className="yaml-preview">
                  <h3>Preview:</h3>
                  <pre>{yamlContent}</pre>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="button-group">
                <button
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleDeploy}
                  disabled={loading || !yamlContent}
                >
                  {loading ? 'Deploying...' : 'Deploy'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="deploy-results">
                <h3>Deployment Results</h3>
                <div className="results-summary">
                  <div className="summary-stat success">
                    <span className="stat-label">Success:</span>
                    <span className="stat-value">{successCount}</span>
                  </div>
                  {failureCount > 0 && (
                    <div className="summary-stat failure">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value">{failureCount}</span>
                    </div>
                  )}
                </div>

                <div className="results-list">
                  {deployResults.map((result, index) => (
                    <div
                      key={index}
                      className={`result-item ${result.success ? 'success' : 'failure'}`}
                    >
                      <div className="result-service">{result.service_name}</div>
                      {result.success ? (
                        <div className="result-status">
                          Created (ID: {result.container_id?.substring(0, 12)})
                        </div>
                      ) : (
                        <div className="result-error">Error: {result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="button-group">
                <button
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </button>
                {successCount > 0 && (
                  <button
                    className="btn-primary"
                    onClick={handleStartAll}
                    disabled={loading}
                  >
                    {loading ? 'Starting...' : 'Start All Containers'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposeUpload;
