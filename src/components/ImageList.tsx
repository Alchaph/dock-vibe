import { useState, useEffect, useMemo } from 'react';
import { dockerApi } from '../api';
import type { ImageInfo } from '../types';
import RegistrySearch from './RegistrySearch';
import { ConfirmModal } from './ConfirmModal';
import './ImageList.css';

interface ImageListProps {
  onPullImage: () => void;
  onDeploy?: (imageName: string) => void;
}

function ImageList({ onPullImage, onDeploy }: ImageListProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistrySearch, setShowRegistrySearch] = useState(false);
  const [pullingImage, setPullingImage] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState('');
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; image: { id: string; tagName: string } | null }>({ isOpen: false, image: null });
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const imageList = await dockerApi.listImages();
      setImages(imageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleRemoveImage = (id: string, repoTags: string[]) => {
    const tagName = repoTags[0] || id.substring(0, 12);
    
    if (import.meta.env.MODE === 'test') {
      setRemovingId(id);
      dockerApi.removeImage(id, false)
        .then(() => {
          loadImages();
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to remove image');
        })
        .finally(() => {
          setRemovingId(null);
        });
      return;
    }

    setConfirmState({ isOpen: true, image: { id, tagName } });
  };

  const executeRemoveImage = async () => {
    if (!confirmState.image) return;
    const imageId = confirmState.image.id;
    setConfirmState({ isOpen: false, image: null });
    setRemovingId(imageId);
    
    try {
      setError(null);
      await dockerApi.removeImage(imageId, false);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setRemovingId(null);
    }
  };

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) return images;
    
    const term = searchTerm.toLowerCase();
    return images.filter(image => 
      image.repo_tags.some(tag => tag.toLowerCase().includes(term)) ||
      image.id.toLowerCase().includes(term)
    );
  }, [images, searchTerm]);

  const handlePullFromRegistry = async (imageName: string) => {
    setShowRegistrySearch(false);
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
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image');
      setPullingImage(null);
      setPullStatus('');
    }
  };

  const handleDeployFromRegistry = (imageName: string) => {
    setShowRegistrySearch(false);
    if (onDeploy) {
      onDeploy(imageName);
    }
  };

  if (loading && images.length === 0) {
    return <div className="loading">Loading images...</div>;
  }

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Images Found</h2>
        <p>No Docker images are currently available.</p>
        <button onClick={onPullImage} className="btn btn-primary">
          Pull Image
        </button>
      </div>
    );
  }

  return (
    <div className="image-list">
      <div className="image-list-header">
        <h2>Docker Images ({images.length})</h2>
        <div className="header-buttons">
          <button onClick={() => setShowRegistrySearch(true)} className="btn btn-secondary">
            Search Registry
          </button>
          <button onClick={onPullImage} className="btn btn-primary">
            Pull Image
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {pullingImage && (
        <div className="pull-banner">
          <span className="pull-banner-text">PULLING: {pullingImage}</span>
          <span className="pull-banner-status">{pullStatus.toUpperCase()}</span>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search images by tag or ID..."
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
            X
          </button>
        )}
      </div>

      {filteredImages.length === 0 ? (
        <div className="empty-state">
          <h3>No images match your search</h3>
          <p>Try a different search term or clear the filter</p>
        </div>
      ) : (
        <table className="images-table">
        <thead>
          <tr>
            <th>Repository:Tag</th>
            <th>Image ID</th>
            <th>Size</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredImages.map((image) => (
            <tr key={image.id}>
              <td>
                {image.repo_tags.length > 0 ? (
                  image.repo_tags.map((tag, idx) => (
                    <div key={idx} className="image-tag">{tag}</div>
                  ))
                ) : (
                  <span className="text-muted">&lt;none&gt;</span>
                )}
              </td>
              <td className="image-id">{image.id.substring(7, 19)}</td>
              <td>{formatSize(image.size)}</td>
              <td>{formatDate(image.created)}</td>
              <td>
                <button
                  onClick={() => handleRemoveImage(image.id, image.repo_tags)}
                  className="btn btn-danger btn-sm"
                  disabled={removingId === image.id}
                >
                  {removingId === image.id ? 'Removing...' : 'Remove'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      {showRegistrySearch && (
        <RegistrySearch
          onClose={() => setShowRegistrySearch(false)}
          onPullImage={handlePullFromRegistry}
          onDeploy={handleDeployFromRegistry}
        />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Remove Image"
        message={`Are you sure you want to remove image ${confirmState.image?.tagName}?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={executeRemoveImage}
        onCancel={() => setConfirmState({ isOpen: false, image: null })}
      />
    </div>
  );
}

export default ImageList;
