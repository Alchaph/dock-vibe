import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrySearch from './RegistrySearch';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockResults = [
  { name: 'nginx', description: 'Official Nginx image', star_count: 18000, is_official: true, is_automated: false },
  { name: 'jwilder/nginx-proxy', description: 'Nginx proxy', star_count: 5000, is_official: false, is_automated: true },
  { name: 'custom/nginx', description: '', star_count: 10, is_official: false, is_automated: false },
];

const onClose = vi.fn();
const onPullImage = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'search_docker_hub') return mockResults;
    return undefined;
  });
});

describe('RegistrySearch', () => {
  it('renders search modal with input', () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    expect(screen.getByText('Search Docker Hub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for images/)).toBeInTheDocument();
  });

  it('shows welcome state initially', () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    expect(screen.getByText('Search Docker Hub for images')).toBeInTheDocument();
  });

  it('searches and displays results', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('nginx')).toBeInTheDocument();
      expect(screen.getByText('jwilder/nginx-proxy')).toBeInTheDocument();
      expect(screen.getByText('Found 3 images')).toBeInTheDocument();
    });
  });

  it('shows OFFICIAL badge for official images', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('OFFICIAL')).toBeInTheDocument();
    });
  });

  it('shows AUTOMATED badge for automated builds', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('AUTOMATED')).toBeInTheDocument();
    });
  });

  it('shows star counts', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Stars: 18000')).toBeInTheDocument();
    });
  });

  it('shows "No description available" for images without description', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });
  });

  it('calls onPullImage when Pull Image button is clicked', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => screen.getAllByText('Pull Image'));
    const pullButtons = screen.getAllByText('Pull Image');
    await userEvent.click(pullButtons[0]);

    expect(onPullImage).toHaveBeenCalledWith('nginx');
  });

  it('shows empty state when no results', async () => {
    mockInvoke.mockResolvedValue([]);
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nonexistentimage');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText(/No images found for/)).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Searching Docker Hub...')).toBeInTheDocument();
    });
  });

  it('shows error on search failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Network timeout'));
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    const input = screen.getByPlaceholderText(/Search for images/);
    await userEvent.type(input, 'nginx');
    await userEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  it('validates empty search query', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    await userEvent.click(screen.getByText('Search'));

    expect(screen.getByText('Please enter a search query')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

    await userEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });

  describe('deploy functionality', () => {
    it('renders Deploy button when onDeploy prop is provided', async () => {
      const onDeploy = vi.fn();
      render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} onDeploy={onDeploy} />);

      const input = screen.getByPlaceholderText(/Search for images/);
      await userEvent.type(input, 'nginx');
      await userEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getAllByText('Deploy').length).toBeGreaterThan(0);
      });
    });

    it('does NOT render Deploy button when onDeploy prop is not provided', async () => {
      render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} />);

      const input = screen.getByPlaceholderText(/Search for images/);
      await userEvent.type(input, 'nginx');
      await userEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.queryByText('Deploy')).not.toBeInTheDocument();
      });
    });

    it('calls onDeploy with image name when Deploy button is clicked', async () => {
      const onDeploy = vi.fn();
      render(<RegistrySearch onClose={onClose} onPullImage={onPullImage} onDeploy={onDeploy} />);

      const input = screen.getByPlaceholderText(/Search for images/);
      await userEvent.type(input, 'nginx');
      await userEvent.click(screen.getByText('Search'));

      await waitFor(() => screen.getAllByText('Deploy'));
      const deployButtons = screen.getAllByText('Deploy');
      await userEvent.click(deployButtons[0]);

      expect(onDeploy).toHaveBeenCalledWith('nginx');
    });
  });
});
