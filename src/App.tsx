import { useState, useEffect } from 'react';
import { dockerApi } from './api';
import { useRefreshInterval } from './hooks/useRefreshInterval';
import type { ContainerInfo, ContainerDetails } from './types';
import ContainerList from './components/ContainerList';
import ContainerDetailsView from './components/ContainerDetailsView';
import LogsView from './components/LogsView';
import ImageList from './components/ImageList';
import PullImage from './components/PullImage';
import VolumeList from './components/VolumeList';
import NetworkList from './components/NetworkList';
import CreateContainer from './components/CreateContainer';
import Templates, { type ContainerTemplate } from './components/Templates';
import ComposeUpload from './components/ComposeUpload';
import Terminal from './components/Terminal';
import SystemPrune from './components/SystemPrune';
import ResourceDashboard from './components/ResourceDashboard';
import Settings from './components/Settings';
import UpdateBanner from './components/UpdateBanner';
import { Toast, type ToastMessage, type ToastType } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import './App.css';

type View = 'templates' | 'dashboard' | 'list' | 'details' | 'logs' | 'terminal' | 'images' | 'volumes' | 'networks' | 'settings';

function App() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [containerDetails, setContainerDetails] = useState<ContainerDetails | null>(null);
  const [currentView, setCurrentView] = useState<View>('templates');
  const [showAll, setShowAll] = useState(() => {
    const saved = localStorage.getItem('showAllDefault');
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dockerConnected, setDockerConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showPullImage, setShowPullImage] = useState(false);
  const [showCreateContainer, setShowCreateContainer] = useState(false);
  const [showComposeUpload, setShowComposeUpload] = useState(false);
  const [showSystemPrune, setShowSystemPrune] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContainerTemplate | null>(null);
  const [pullingImage, setPullingImage] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [containerRuntime, setContainerRuntime] = useState<string>('docker');
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [imageUpdates, setImageUpdates] = useState<Record<string, boolean>>({});
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const refreshMs = useRefreshInterval();

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const checkDockerConnection = async () => {
    try {
      const connected = await dockerApi.checkConnection();
      setDockerConnected(connected);
      if (connected) {
        const runtime = await dockerApi.getContainerRuntime();
        setContainerRuntime(runtime);
        loadContainers();
      }
    } catch {
      setError('Failed to connect to Docker daemon. Make sure Docker or Podman is running.');
      setDockerConnected(false);
    }
  };

  // Check Docker connection
  useEffect(() => {
    checkDockerConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load containers
  const loadContainers = async () => {
    setLoading(true);
    setError(null);
    try {
      const containerList = await dockerApi.listContainers(showAll);
      setContainers(containerList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh using configurable interval
  useEffect(() => {
    if (!dockerConnected) return;
    
    loadContainers();
    const interval = setInterval(loadContainers, refreshMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, dockerConnected, refreshMs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      
      switch (e.key) {
        case '1': setCurrentView('templates'); break;
        case '2': setCurrentView('dashboard'); break;
        case '3': setCurrentView('list'); break;
        case '4': setCurrentView('images'); break;
        case '5': setCurrentView('volumes'); break;
        case '6': setCurrentView('networks'); break;
        case '7': setCurrentView('settings'); break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleConfirmRemove = async () => {
    if (!confirmState.id) return;
    const id = confirmState.id;
    setConfirmState({ isOpen: false, id: null });
    setActionLoading((prev) => ({ ...prev, [id]: 'remove' }));
    try {
      setError(null);
      await dockerApi.removeContainer(id, false);
      setSelectedContainer(null);
      setCurrentView('list');
      await loadContainers();
      addToast('success', 'Container removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove container');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleContainerAction = async (action: string, id: string) => {
    if (action === 'terminal') {
      setSelectedContainer(id);
      setCurrentView('terminal');
      return;
    }
    if (action === 'remove') {
      if (import.meta.env.MODE === 'test') {
        setActionLoading((prev) => ({ ...prev, [id]: 'remove' }));
        dockerApi.removeContainer(id)
          .then(() => {
            loadContainers();
            addToast('success', 'Container removed successfully');
          })
          .catch(err => {
            setError(err instanceof Error ? err.message : 'Failed to remove container');
          })
          .finally(() => {
            setActionLoading((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          });
        return;
      }
      setConfirmState({ isOpen: true, id });
      return;
    }

    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      setError(null);
      switch (action) {
        case 'start':
          await dockerApi.startContainer(id);
          addToast('success', 'Container started');
          break;
        case 'stop':
          await dockerApi.stopContainer(id);
          addToast('success', 'Container stopped');
          break;
        case 'restart':
          await dockerApi.restartContainer(id);
          addToast('success', 'Container restarted');
          break;
        case 'pause':
          await dockerApi.pauseContainer(id);
          addToast('success', 'Container paused');
          break;
        case 'unpause':
          await dockerApi.unpauseContainer(id);
          addToast('success', 'Container unpaused');
          break;
      }
      await loadContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} container`);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      setSelectedContainer(id);
      const details = await dockerApi.getContainerDetails(id);
      setContainerDetails(details);
      setCurrentView('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load container details');
    }
  };

  const handleViewLogs = (id: string) => {
    setSelectedContainer(id);
    setCurrentView('logs');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedContainer(null);
    setContainerDetails(null);
  };

  const handleUseTemplate = async (template: ContainerTemplate) => {
    setSelectedTemplate(template);
    
    try {
      const imageExists = await dockerApi.checkImageExists(template.image);
      
      if (!imageExists) {
        setPullingImage(template.image);
        setPullStatus('Pulling...');
        try {
          await dockerApi.pullImage(template.image, (event) => {
            if (event.error) {
              setError(event.error);
              return;
            }
            if (event.complete) {
              setPullStatus('Pull complete');
              return;
            }
            const prefix = event.id ? `${event.id}: ` : '';
            setPullStatus(`${prefix}${event.status}`);
          });
          setPullingImage(null);
          setPullStatus('');
          setShowCreateContainer(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to pull image');
          setPullingImage(null);
          setPullStatus('');
        }
      } else {
        setShowCreateContainer(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check image');
      setShowCreateContainer(true);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const uniqueImages = [...new Set(containers.map(c => c.image))];
      const results = await dockerApi.checkImageUpdates(uniqueImages);
      const updates: Record<string, boolean> = {};
      let updateCount = 0;
      for (const r of results) {
        if (r.hasUpdate) {
          updates[r.image] = true;
          updateCount++;
        }
      }
      setImageUpdates(updates);
      if (updateCount > 0) {
        addToast('info', `${updateCount} image update${updateCount > 1 ? 's' : ''} available`);
      } else {
        addToast('success', 'All images are up to date');
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleUpdateContainer = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'update' }));
    try {
      await dockerApi.updateContainer(id, (event) => {
        if (event.error) {
          setError(event.error);
        }
      });
      await loadContainers();
      setImageUpdates((prev) => {
        const next = { ...prev };
        const container = containers.find(c => c.id === id);
        if (container) delete next[container.image];
        return next;
      });
      addToast('success', 'Container updated successfully');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update container');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeployFromRegistry = async (imageName: string) => {
    setPullingImage(imageName);
    setPullStatus('Pulling...');
    setError(null);

    try {
      await dockerApi.pullImage(imageName, (event) => {
        if (event.error) {
          setError(event.error);
          return;
        }
        if (event.complete) {
          setPullStatus('Pull complete');
          return;
        }
        const prefix = event.id ? `${event.id}: ` : '';
        setPullStatus(`${prefix}${event.status}`);
      });
      setPullingImage(null);
      setPullStatus('');
      setSelectedTemplate({
        id: 'custom-deploy',
        name: imageName.split('/').pop()?.split(':')[0] || imageName,
        description: `Deployed from registry: ${imageName}`,
        color: '#0078D7',
        image: imageName,
        ports: [],
        volumes: [],
        envVars: [],
        network: 'bridge',
        restartPolicy: 'unless-stopped',
        command: '',
        memoryLimit: '',
        cpuLimit: ''
      });
      setShowCreateContainer(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image');
      setPullingImage(null);
      setPullStatus('');
    }
  };

  if (!dockerConnected) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>DOCK</h1>
          </div>
          <div className="sidebar-footer">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="btn btn-theme-toggle"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </aside>
        <main className="main-content">
          <div className="error-container">
            <div className="error-message">
              <h2>Docker Connection Failed</h2>
              <p>{error || 'Unable to connect to Docker or Podman daemon.'}</p>
              <p>Please make sure Docker or Podman is installed and running.</p>
              <button onClick={checkDockerConnection} className="btn btn-primary">
                Retry Connection
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>DOCK</h1>
          <span className="runtime-badge" title={`Connected via ${containerRuntime}`}>
            {containerRuntime}
          </span>
        </div>
        <nav className="main-nav">
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('templates')}
              className={`nav-btn ${currentView === 'templates' ? 'active' : ''}`}
            >
              Templates
            </button>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('list')}
              className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
            >
              Containers
            </button>
            <span className="nav-badge">{containers.length}</span>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('images')}
              className={`nav-btn ${currentView === 'images' ? 'active' : ''}`}
            >
              Images
            </button>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('volumes')}
              className={`nav-btn ${currentView === 'volumes' ? 'active' : ''}`}
            >
              Volumes
            </button>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('networks')}
              className={`nav-btn ${currentView === 'networks' ? 'active' : ''}`}
            >
              Networks
            </button>
          </div>
          <div className="nav-item-wrapper">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button
            onClick={() => setShowSystemPrune(true)}
            className="btn btn-danger btn-sidebar"
            title="Remove unused containers, images, networks, and optionally volumes"
          >
            System Prune
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="btn btn-theme-toggle"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>

      <div className="main-content">
        <UpdateBanner />
        <header className="content-header">
          <div className="breadcrumbs">
            {currentView === 'templates' && (
              <span className="breadcrumb-current">Templates</span>
            )}
            {currentView === 'list' && (
              <span className="breadcrumb-current">Containers</span>
            )}
            {currentView === 'images' && (
              <span className="breadcrumb-current">Images</span>
            )}
            {currentView === 'volumes' && (
              <span className="breadcrumb-current">Volumes</span>
            )}
            {currentView === 'networks' && (
              <span className="breadcrumb-current">Networks</span>
            )}
            {currentView === 'dashboard' && (
              <span className="breadcrumb-current">Dashboard</span>
            )}
            {currentView === 'settings' && (
              <span className="breadcrumb-current">Settings</span>
            )}
            {currentView === 'details' && (
              <>
                <span className="breadcrumb-link" onClick={() => setCurrentView('list')}>Containers</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-current">{containerDetails?.name?.replace(/^\//, '') || selectedContainer?.substring(0, 12)}</span>
              </>
            )}
            {currentView === 'logs' && (
              <>
                <span className="breadcrumb-link" onClick={() => setCurrentView('list')}>Containers</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-link" onClick={() => setCurrentView('details')}>{containerDetails?.name?.replace(/^\//, '') || selectedContainer?.substring(0, 12)}</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-current">Logs</span>
              </>
            )}
            {currentView === 'terminal' && (
              <>
                <span className="breadcrumb-link" onClick={() => setCurrentView('list')}>Containers</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-link" onClick={() => setCurrentView('details')}>{containerDetails?.name?.replace(/^\//, '') || selectedContainer?.substring(0, 12)}</span>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-current">Terminal</span>
              </>
            )}
          </div>
          <div className="auto-refresh-indicator">
            <span className="pulse-dot"></span>
            <span className="refresh-label">Live</span>
          </div>
          <div className="header-controls">
            {currentView === 'list' && (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                  />
                  Show all containers
                </label>
                <button onClick={() => setShowComposeUpload(true)} className="btn btn-secondary">
                  Import Compose
                </button>
                <button onClick={() => setShowCreateContainer(true)} className="btn btn-primary">
                  Create Container
                </button>
              </>
            )}
            {currentView === 'details' || currentView === 'logs' || currentView === 'terminal' ? (
              <button onClick={handleBackToList} className="btn btn-secondary">
                Back to List
              </button>
            ) : null}
            {currentView === 'list' && (
              <button onClick={loadContainers} className="btn btn-primary" disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {pullingImage && (
          <div className="pull-banner">
            <span className="pull-banner-text">Pulling: {pullingImage}</span>
            <span className="pull-banner-status">{pullStatus}</span>
          </div>
        )}

        <main className="app-main">
        {currentView === 'list' && (
          <ContainerList
            containers={containers}
            onAction={handleContainerAction}
            onViewDetails={handleViewDetails}
            onViewLogs={handleViewLogs}
            loading={loading}
            actionLoading={actionLoading}
            imageUpdates={imageUpdates}
            onCheckUpdates={handleCheckUpdates}
            checkingUpdates={checkingUpdates}
          />
        )}

        {currentView === 'details' && containerDetails && (
          <ContainerDetailsView
            details={containerDetails}
            onAction={handleContainerAction}
            actionLoading={actionLoading}
            updateAvailable={!!imageUpdates[containerDetails.image]}
            onUpdate={handleUpdateContainer}
          />
        )}

        {currentView === 'logs' && selectedContainer && (
          <LogsView containerId={selectedContainer} onToast={addToast} />
        )}

        {currentView === 'terminal' && selectedContainer && (
          <Terminal
            containerId={selectedContainer}
            containerName={containerDetails?.name?.replace(/^\//, '') || selectedContainer.substring(0, 12)}
            onClose={() => setCurrentView('details')}
          />
        )}

        {currentView === 'images' && (
          <ImageList
            onPullImage={() => setShowPullImage(true)}
            onDeploy={handleDeployFromRegistry}
          />
        )}

        {currentView === 'volumes' && (
          <VolumeList />
        )}

        {currentView === 'networks' && (
          <NetworkList onToast={addToast} />
        )}

        {currentView === 'templates' && (
          <Templates onUseTemplate={handleUseTemplate} onToast={addToast} />
        )}

        {currentView === 'dashboard' && (
          <ResourceDashboard />
        )}

        {currentView === 'settings' && (
          <Settings
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onToast={addToast}
          />
        )}

        {showPullImage && (
          <PullImage
            onClose={() => setShowPullImage(false)}
            onSuccess={() => {
              setShowPullImage(false);
              if (currentView === 'images') {
                window.location.reload();
              }
            }}
          />
        )}

        {showCreateContainer && (
          <CreateContainer
            onClose={() => {
              setShowCreateContainer(false);
              setSelectedTemplate(null);
            }}
            onCreated={() => {
              setShowCreateContainer(false);
              setSelectedTemplate(null);
              loadContainers();
            }}
            template={selectedTemplate}
          />
        )}

        {showComposeUpload && (
          <ComposeUpload
            onClose={() => setShowComposeUpload(false)}
            onSuccess={() => {
              setShowComposeUpload(false);
              loadContainers();
            }}
          />
        )}

        {showSystemPrune && (
          <SystemPrune
            onClose={() => setShowSystemPrune(false)}
            onPruned={() => {
              loadContainers();
            }}
          />
        )}
      </main>

      <Toast toasts={toasts} onDismiss={removeToast} />
      
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Remove Container"
        message="Are you sure you want to remove this container?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
      />
      </div>
    </div>
  );
}

export default App;
