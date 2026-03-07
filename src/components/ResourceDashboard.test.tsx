import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResourceDashboard from './ResourceDashboard';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  Channel: class MockChannel {
    onmessage: ((msg: unknown) => void) | null = null;
  },
}));

const mockInvoke = vi.mocked(invoke);

const mockStats = [
  {
    id: 'abc123',
    name: 'my-nginx',
    image: 'nginx:latest',
    state: 'running',
    cpu_usage: 12.5,
    memory_usage: 52428800,
    memory_limit: 2147483648,
    memory_percent: 2.44,
    network_rx: 1048576,
    network_tx: 524288,
  },
  {
    id: 'def456',
    name: 'my-postgres',
    image: 'postgres:16',
    state: 'running',
    cpu_usage: 65.3,
    memory_usage: 536870912,
    memory_limit: 2147483648,
    memory_percent: 25.0,
    network_rx: 10485760,
    network_tx: 5242880,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  localStorage.setItem('refreshInterval', '3');
  mockInvoke.mockResolvedValue(mockStats);
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('ResourceDashboard', () => {
  it('shows loading state initially', () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<ResourceDashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders container stats after loading', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('my-nginx')).toBeInTheDocument();
      expect(screen.getByText('my-postgres')).toBeInTheDocument();
    });
  });

  it('displays container images', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
      expect(screen.getByText('postgres:16')).toBeInTheDocument();
    });
  });

  it('displays CPU usage with progress bars', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('12.50%')).toBeInTheDocument();
      expect(screen.getByText('65.30%')).toBeInTheDocument();
    });
  });

  it('displays memory usage formatted as bytes', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/50 MB/)).toBeInTheDocument();
      expect(screen.getByText(/512 MB/)).toBeInTheDocument();
    });
  });

  it('displays network RX and TX', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('RX: 1 MB')).toBeInTheDocument();
      expect(screen.getByText('TX: 512 KB')).toBeInTheDocument();
    });
  });

  it('shows running container count', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows empty state when no running containers', async () => {
    vi.useRealTimers();
    mockInvoke.mockResolvedValue([]);
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no running containers/i)).toBeInTheDocument();
    });
  });

  it('shows error state with retry button', async () => {
    vi.useRealTimers();
    mockInvoke.mockRejectedValue(new Error('Connection refused'));
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/connection refused/i)).toBeInTheDocument();
      expect(screen.getByText('RETRY')).toBeInTheDocument();
    });
  });

  it('retries fetching on retry button click', async () => {
    vi.useRealTimers();
    mockInvoke.mockRejectedValueOnce(new Error('Connection refused'));
    mockInvoke.mockResolvedValue(mockStats);
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(screen.getByText('RETRY')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('RETRY'));

    await waitFor(() => {
      expect(screen.getByText('my-nginx')).toBeInTheDocument();
    });
  });

  it('calls getAllContainerStats on mount', async () => {
    vi.useRealTimers();
    render(<ResourceDashboard />);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get_all_container_stats');
    });
  });

  it('polls for stats every 3 seconds', async () => {
    render(<ResourceDashboard />);

    await vi.advanceTimersByTimeAsync(0);
    expect(mockInvoke).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(3000);
    expect(mockInvoke).toHaveBeenCalledTimes(3);
  });

  it('cleans up interval on unmount', async () => {
    const { unmount } = render(<ResourceDashboard />);

    await vi.advanceTimersByTimeAsync(0);
    expect(mockInvoke).toHaveBeenCalledTimes(1);

    unmount();

    await vi.advanceTimersByTimeAsync(6000);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});
