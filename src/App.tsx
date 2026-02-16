import { useState, useEffect } from 'react';
import { dockerApi } from './api';
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
import './App.css';

type View = 'list' | 'details' | 'logs' | 'images' | 'volumes' | 'networks' | 'templates';

function App() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [containerDetails, setContainerDetails] = useState<ContainerDetails | null>(null);
  const [currentView, setCurrentView] = useState<View>('list');
  const [showAll, setShowAll] = useState(false);
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
  const [selectedTemplate, setSelectedTemplate] = useState<ContainerTemplate | null>(null);
  const [pullingImage, setPullingImage] = useState(false);
  const [pullProgress, setPullProgress] = useState<string>('');

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
        loadContainers();
      }
    } catch {
      setError('Failed to connect to Docker daemon. Make sure Docker is running.');
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

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!dockerConnected) return;
    
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, dockerConnected]);

  const handleContainerAction = async (action: string, id: string) => {
    try {
      setError(null);
      switch (action) {
        case 'start':
          await dockerApi.startContainer(id);
          break;
        case 'stop':
          await dockerApi.stopContainer(id);
          break;
        case 'restart':
          await dockerApi.restartContainer(id);
          break;
        case 'pause':
          await dockerApi.pauseContainer(id);
          break;
        case 'unpause':
          await dockerApi.unpauseContainer(id);
          break;
        case 'remove':
          if (confirm('Are you sure you want to remove this container?')) {
            await dockerApi.removeContainer(id, false);
            setSelectedContainer(null);
            setCurrentView('list');
          }
          break;
      }
      await loadContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} container`);
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
    
    // Check if image exists
    try {
      const imageExists = await dockerApi.checkImageExists(template.image);
      
      if (!imageExists) {
        // Auto-pull the image
        setPullingImage(true);
        setPullProgress(`Pulling ${template.image}...`);
        
        try {
          await dockerApi.pullImage(template.image);
          setPullProgress(`Successfully pulled ${template.image}`);
          
          // Wait a moment to show success message
          setTimeout(() => {
            setPullingImage(false);
            setPullProgress('');
            setShowCreateContainer(true);
          }, 1000);
        } catch (err) {
          setPullingImage(false);
          setPullProgress('');
          setError(err instanceof Error ? err.message : 'Failed to pull image');
          // Still show create container dialog in case they want to try manually
          setShowCreateContainer(true);
        }
      } else {
        // Image exists, proceed directly
        setShowCreateContainer(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check image');
      setShowCreateContainer(true);
    }
  };

  if (!dockerConnected) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>DOCK</h1>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="btn btn-theme-toggle"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀' : '☾'}
          </button>
        </header>
        <div className="error-container">
          <div className="error-message">
            <h2>Docker Connection Failed</h2>
            <p>{error || 'Unable to connect to Docker daemon.'}</p>
            <p>Please make sure Docker is installed and running.</p>
            <button onClick={checkDockerConnection} className="btn btn-primary">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>DOCK</h1>
        <nav className="main-nav">
          <button 
            onClick={() => setCurrentView('list')}
            className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
          >
            Containers
          </button>
          <button 
            onClick={() => setCurrentView('images')}
            className={`nav-btn ${currentView === 'images' ? 'active' : ''}`}
          >
            Images
          </button>
          <button 
            onClick={() => setCurrentView('volumes')}
            className={`nav-btn ${currentView === 'volumes' ? 'active' : ''}`}
          >
            Volumes
          </button>
          <button 
            onClick={() => setCurrentView('networks')}
            className={`nav-btn ${currentView === 'networks' ? 'active' : ''}`}
          >
            Networks
          </button>
          <button 
            onClick={() => setCurrentView('templates')}
            className={`nav-btn ${currentView === 'templates' ? 'active' : ''}`}
          >
            Templates
          </button>
        </nav>
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
          {currentView === 'details' || currentView === 'logs' ? (
            <button onClick={handleBackToList} className="btn btn-secondary">
              Back to List
            </button>
          ) : null}
          {currentView === 'list' && (
            <button onClick={loadContainers} className="btn btn-primary" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="btn btn-theme-toggle"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {pullingImage && (
        <div className="info-banner">
          {pullProgress}
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
          />
        )}

        {currentView === 'details' && containerDetails && (
          <ContainerDetailsView
            details={containerDetails}
            onAction={handleContainerAction}
          />
        )}

        {currentView === 'logs' && selectedContainer && (
          <LogsView containerId={selectedContainer} />
        )}

        {currentView === 'images' && (
          <ImageList onPullImage={() => setShowPullImage(true)} />
        )}

        {currentView === 'volumes' && (
          <VolumeList />
        )}

        {currentView === 'networks' && (
          <NetworkList />
        )}

        {currentView === 'templates' && (
          <Templates onUseTemplate={handleUseTemplate} />
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
      </main>
    </div>
  );
}

export default App;
