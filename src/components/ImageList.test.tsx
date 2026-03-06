import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageList from './ImageList';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockImages = [
  {
    id: 'sha256:abc123def456',
    repo_tags: ['nginx:latest', 'nginx:1.25'],
    size: 187000000,
    created: 1700000000,
  },
  {
    id: 'sha256:def456ghi789',
    repo_tags: ['postgres:15'],
    size: 412000000,
    created: 1699000000,
  },
  {
    id: 'sha256:ghi789jkl012',
    repo_tags: [],
    size: 5000000,
    created: 1698000000,
  },
];

const onPullImage = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_images') return mockImages;
    return undefined;
  });
});

describe('ImageList', () => {
  it('renders image table with all images', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
      expect(screen.getByText('postgres:15')).toBeInTheDocument();
    });
  });

  it('shows image count in header', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('Docker Images (3)')).toBeInTheDocument();
    });
  });

  it('shows <none> for images without tags', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('<none>')).toBeInTheDocument();
    });
  });

  it('formats image sizes correctly', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('178.3 MB')).toBeInTheDocument();
    });
  });

  it('shows empty state when no images', async () => {
    mockInvoke.mockResolvedValue([]);
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('No Images Found')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockInvoke.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<ImageList onPullImage={onPullImage} />);

    expect(screen.getByText('Loading images...')).toBeInTheDocument();
  });

  it('calls onPullImage when Pull Image button is clicked', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => screen.getByText('Pull Image'));
    await userEvent.click(screen.getByText('Pull Image'));

    expect(onPullImage).toHaveBeenCalled();
  });

  it('has Search Registry button', async () => {
    render(<ImageList onPullImage={onPullImage} />);

    await waitFor(() => {
      expect(screen.getByText('Search Registry')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters images by tag', async () => {
      render(<ImageList onPullImage={onPullImage} />);

      await waitFor(() => screen.getByText('nginx:latest'));

      const searchInput = screen.getByPlaceholderText('Search images by tag or ID...');
      await userEvent.type(searchInput, 'nginx');

      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
      expect(screen.queryByText('postgres:15')).not.toBeInTheDocument();
    });

    it('shows no match message for empty search results', async () => {
      render(<ImageList onPullImage={onPullImage} />);

      await waitFor(() => screen.getByText('nginx:latest'));

      const searchInput = screen.getByPlaceholderText('Search images by tag or ID...');
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('No images match your search')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows empty state on load failure', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'list_images') throw new Error('Failed to connect');
        return undefined;
      });
      render(<ImageList onPullImage={onPullImage} />);

      await waitFor(() => {
        expect(screen.getByText('No Images Found')).toBeInTheDocument();
      });
    });
  });
});
