import { useState, useEffect } from 'react';
import { dockerApi } from '../api';
import type { ImageInfo, CreateContainerRequest } from '../types';
import type { ContainerTemplate } from './Templates';
import './CreateContainer.css';

interface CreateContainerProps {
  onClose: () => void;
  onCreated: () => void;
  template?: ContainerTemplate | null;
}

interface PortMapping {
  containerPort: string;
  hostPort: string;
}

interface EnvVar {
  key: string;
  value: string;
}

interface Volume {
  source: string;
  target: string;
  readonly: boolean;
}

function CreateContainer({ onClose, onCreated, template }: CreateContainerProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState(template?.image || '');
  const [containerName, setContainerName] = useState('');
  const [ports, setPorts] = useState<PortMapping[]>(template?.ports || []);
  const [volumes, setVolumes] = useState<Volume[]>(template?.volumes || []);
  const [envVars, setEnvVars] = useState<EnvVar[]>(template?.envVars || []);
  const [network, setNetwork] = useState(template?.network || 'bridge');
  const [restartPolicy, setRestartPolicy] = useState(template?.restartPolicy || 'no');
  const [command, setCommand] = useState(template?.command || '');
  const [memoryLimit, setMemoryLimit] = useState(template?.memoryLimit || '');
  const [cpuLimit, setCpuLimit] = useState(template?.cpuLimit || '');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const imageList = await dockerApi.listImages();
      setImages(imageList);
      // Only set default image if no template was provided
      if (!template && imageList.length > 0 && imageList[0].repo_tags.length > 0) {
        setSelectedImage(imageList[0].repo_tags[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    }
  };

  const addPort = () => {
    setPorts([...ports, { containerPort: '', hostPort: '' }]);
  };

  const updatePort = (index: number, field: 'containerPort' | 'hostPort', value: string) => {
    const updated = [...ports];
    updated[index][field] = value;
    setPorts(updated);
  };

  const removePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const addVolume = () => {
    setVolumes([...volumes, { source: '', target: '', readonly: false }]);
  };

  const updateVolume = (index: number, field: 'source' | 'target' | 'readonly', value: string | boolean) => {
    const updated = [...volumes];
    (updated[index][field] as any) = value;
    setVolumes(updated);
  };

  const removeVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index));
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Build port mappings
      const portMappings: Record<string, string> = {};
      ports.forEach(p => {
        if (p.containerPort && p.hostPort) {
          const containerKey = p.containerPort.includes('/') ? p.containerPort : `${p.containerPort}/tcp`;
          portMappings[containerKey] = p.hostPort;
        }
      });

      // Build volume specs
      const volumeSpecs: string[] = volumes
        .filter(v => v.source && v.target)
        .map(v => `${v.source}:${v.target}${v.readonly ? ':ro' : ''}`);

      // Build env vars
      const envList: string[] = envVars
        .filter(e => e.key)
        .map(e => `${e.key}=${e.value}`);

      // Build command array
      const cmdArray = command.trim() 
        ? command.trim().split(/\s+/)
        : undefined;

      // Parse resource limits
      const memoryBytes = memoryLimit ? parseFloat(memoryLimit) * 1024 * 1024 : undefined;
      const cpuQuota = cpuLimit ? parseFloat(cpuLimit) * 100000 : undefined;

      const request: CreateContainerRequest = {
        image: selectedImage,
        name: containerName.trim() || undefined,
        ports: Object.keys(portMappings).length > 0 ? portMappings : undefined,
        volumes: volumeSpecs.length > 0 ? volumeSpecs : undefined,
        env: envList.length > 0 ? envList : undefined,
        network: network !== 'bridge' ? network : undefined,
        restart_policy: restartPolicy !== 'no' ? restartPolicy : undefined,
        command: cmdArray,
        memory_limit: memoryBytes,
        cpu_quota: cpuQuota,
      };

      // If created from a template, create AND start the container
      // Otherwise just create it (user can manually start it)
      if (template) {
        await dockerApi.createAndStartContainer(request);
      } else {
        await dockerApi.createContainer(request);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create container');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-container-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{template ? `Create Container - ${template.name}` : 'Create Container'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="create-container-form">
          <div className="form-section">
            <h3>Basic Configuration</h3>
            
            <div className="form-group">
              <label htmlFor="image">Image *</label>
              <select
                id="image"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value)}
                required
              >
                <option value="">Select an image...</option>
                {images.map(img => 
                  img.repo_tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="containerName">Container Name (optional)</label>
              <input
                id="containerName"
                type="text"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="my-container"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Port Mappings</h3>
            {ports.map((port, idx) => (
              <div key={idx} className="port-row">
                <input
                  type="text"
                  placeholder="Host Port"
                  value={port.hostPort}
                  onChange={(e) => updatePort(idx, 'hostPort', e.target.value)}
                />
                <span>→</span>
                <input
                  type="text"
                  placeholder="Container Port (e.g., 80/tcp)"
                  value={port.containerPort}
                  onChange={(e) => updatePort(idx, 'containerPort', e.target.value)}
                />
                <button type="button" onClick={() => removePort(idx)} className="btn-remove">✕</button>
              </div>
            ))}
            <button type="button" onClick={addPort} className="btn btn-secondary btn-sm">
              + Add Port
            </button>
          </div>

          <div className="form-section">
            <h3>Volume Mounts</h3>
            {volumes.map((vol, idx) => (
              <div key={idx} className="volume-row">
                <input
                  type="text"
                  placeholder="Source (volume name or host path)"
                  value={vol.source}
                  onChange={(e) => updateVolume(idx, 'source', e.target.value)}
                />
                <span>→</span>
                <input
                  type="text"
                  placeholder="Container Path"
                  value={vol.target}
                  onChange={(e) => updateVolume(idx, 'target', e.target.value)}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={vol.readonly}
                    onChange={(e) => updateVolume(idx, 'readonly', e.target.checked)}
                  />
                  Read-only
                </label>
                <button type="button" onClick={() => removeVolume(idx)} className="btn-remove">✕</button>
              </div>
            ))}
            <button type="button" onClick={addVolume} className="btn btn-secondary btn-sm">
              + Add Volume
            </button>
          </div>

          <div className="form-section">
            <h3>Environment Variables</h3>
            {envVars.map((env, idx) => (
              <div key={idx} className="env-row">
                <input
                  type="text"
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => updateEnvVar(idx, 'key', e.target.value)}
                />
                <span>=</span>
                <input
                  type="text"
                  placeholder="value"
                  value={env.value}
                  onChange={(e) => updateEnvVar(idx, 'value', e.target.value)}
                />
                <button type="button" onClick={() => removeEnvVar(idx)} className="btn-remove">✕</button>
              </div>
            ))}
            <button type="button" onClick={addEnvVar} className="btn btn-secondary btn-sm">
              + Add Variable
            </button>
          </div>

          <div className="form-section">
            <h3>Advanced Options</h3>
            
            <div className="form-group">
              <label htmlFor="network">Network</label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="bridge">bridge</option>
                <option value="host">host</option>
                <option value="none">none</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="restartPolicy">Restart Policy</label>
              <select
                id="restartPolicy"
                value={restartPolicy}
                onChange={(e) => setRestartPolicy(e.target.value)}
              >
                <option value="no">no</option>
                <option value="always">always</option>
                <option value="unless-stopped">unless-stopped</option>
                <option value="on-failure">on-failure</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="command">Command (optional)</label>
              <input
                id="command"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g., /bin/sh -c echo hello"
              />
            </div>

            <div className="form-group">
              <label htmlFor="memoryLimit">Memory Limit (MB, optional)</label>
              <input
                id="memoryLimit"
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(e.target.value)}
                placeholder="e.g., 512 for 512MB"
                min="0"
              />
              <small className="form-help">Leave empty for no limit</small>
            </div>

            <div className="form-group">
              <label htmlFor="cpuLimit">CPU Limit (cores, optional)</label>
              <input
                id="cpuLimit"
                type="number"
                value={cpuLimit}
                onChange={(e) => setCpuLimit(e.target.value)}
                placeholder="e.g., 1.5 for 1.5 CPU cores"
                min="0"
                step="0.1"
              />
              <small className="form-help">Leave empty for no limit</small>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || !selectedImage}
            >
              {creating ? 'Creating...' : 'Create Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContainer;
