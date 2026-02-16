import { useState, useEffect, useMemo } from 'react';
import { dockerApi } from '../api';
import type { ImageInfo } from '../types';
import RegistrySearch from './RegistrySearch';
import './ImageList.css';

interface ImageListProps {
  onPullImage: () => void;
}

function ImageList({ onPullImage }: ImageListProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegistrySearch, setShowRegistrySearch] = useState(false);
  const [pullingImage, setPullingImage] = useState<string | null>(null);

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

  const handleRemoveImage = async (id: string, repoTags: string[]) => {
    const tagName = repoTags[0] || id.substring(0, 12);
    if (!confirm(`Are you sure you want to remove image ${tagName}?`)) {
      return;
    }

    try {
      setError(null);
      await dockerApi.removeImage(id, false);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
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

  // Filter images based on search term
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
    setError(null);
    
    try {
      await dockerApi.pullImage(imageName);
      await loadImages();
      setPullingImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image');
      setPullingImage(null);
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
        <div className="info-message">
          Pulling image: {pullingImage}...
        </div>
      )}

      {/* Search bar */}
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
            ✕
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
                >
                  Remove
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
        />
      )}
    </div>
  );
}

export default ImageList;
