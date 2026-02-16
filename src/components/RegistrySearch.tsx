import React, { useState } from 'react';
import { dockerApi } from '../api';
import type { RegistrySearchResult } from '../types';
import './RegistrySearch.css';

interface RegistrySearchProps {
  onClose: () => void;
  onPullImage: (imageName: string) => void;
}

const RegistrySearch: React.FC<RegistrySearchProps> = ({ onClose, onPullImage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegistrySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const searchResults = await dockerApi.searchDockerHub(query, 25);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search registry');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = (imageName: string) => {
    onPullImage(imageName);
  };

  return (
    <div className="registry-search-overlay">
      <div className="registry-search-modal">
        <div className="registry-search-header">
          <h2>Search Docker Hub</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="registry-search-body">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for images (e.g., nginx, postgres, redis)..."
              className="search-input"
              autoFocus
            />
            <button 
              type="submit" 
              className="btn-search"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {loading && (
            <div className="loading-state">
              <p>Searching Docker Hub...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="empty-state">
              <p>No images found for "{query}"</p>
              <p className="hint">Try a different search term</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="results-container">
              <div className="results-header">
                <h3>Found {results.length} images</h3>
              </div>
              <div className="results-list">
                {results.map((result, index) => (
                  <div key={index} className="result-card">
                    <div className="result-header">
                      <div className="result-name">
                        {result.name}
                        {result.is_official && (
                          <span className="badge badge-official">OFFICIAL</span>
                        )}
                        {result.is_automated && (
                          <span className="badge badge-automated">AUTOMATED</span>
                        )}
                      </div>
                      <div className="result-stars">
                        ★ {result.star_count}
                      </div>
                    </div>
                    <div className="result-description">
                      {result.description || 'No description available'}
                    </div>
                    <div className="result-actions">
                      <button
                        className="btn-pull"
                        onClick={() => handlePull(result.name)}
                      >
                        Pull Image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !searched && (
            <div className="welcome-state">
              <p>Search Docker Hub for images</p>
              <p className="hint">Enter a search term to find official and community images</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrySearch;
