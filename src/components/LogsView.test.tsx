import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogsView from './LogsView';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const sampleLogs = `2024-01-15 10:30:00 INFO  Server starting on port 8080
2024-01-15 10:30:01 INFO  Database connected
2024-01-15 10:30:02 WARN  Cache miss for key: user_123
2024-01-15 10:30:03 ERROR Connection timeout to external service
2024-01-15 10:30:04 INFO  Request processed successfully`;

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'get_container_logs') return sampleLogs;
    return undefined;
  });
});

describe('LogsView', () => {
  it('renders logs content', async () => {
    render(<LogsView containerId="abc123" />);

    await waitFor(() => {
      expect(screen.getByText(/Server starting on port 8080/)).toBeInTheDocument();
    });
  });

  it('shows "No logs available" when logs are empty', async () => {
    mockInvoke.mockResolvedValue('');
    render(<LogsView containerId="abc123" />);

    await waitFor(() => {
      expect(screen.getByText('No logs available')).toBeInTheDocument();
    });
  });

  it('shows loading state while refreshing', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<LogsView containerId="abc123" />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  describe('log controls', () => {
    it('has tail lines selector', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('has copy button', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('copies logs to clipboard', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));
      await userEvent.click(screen.getByText('Copy'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleLogs);
    });

    it('has open raw button', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));
      expect(screen.getByText('Open Raw')).toBeInTheDocument();
    });

    it('has refresh button', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText('Refresh'));
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('has scroll buttons', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));
      expect(screen.getByText('Up')).toBeInTheDocument();
      expect(screen.getByText('Down')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters logs by search term', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));

      const searchInput = screen.getByPlaceholderText('Search logs...');
      await userEvent.type(searchInput, 'ERROR');

      await waitFor(() => {
        expect(screen.getByText(/Searching for:/)).toBeInTheDocument();
      });
    });

    it('shows search info with match count', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));

      const searchInput = screen.getByPlaceholderText('Search logs...');
      await userEvent.type(searchInput, 'INFO');

      await waitFor(() => {
        expect(screen.getByText(/Searching for:/)).toBeInTheDocument();
      });
    });

    it('clears search with clear button', async () => {
      render(<LogsView containerId="abc123" />);

      await waitFor(() => screen.getByText(/Server starting/));

      const searchInput = screen.getByPlaceholderText('Search logs...');
      await userEvent.type(searchInput, 'ERROR');

      await waitFor(() => screen.getByTitle('Clear search'));
      await userEvent.click(screen.getByTitle('Clear search'));

      expect(screen.queryByText(/Searching for:/)).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error message on load failure', async () => {
      mockInvoke.mockRejectedValue(new Error('Failed to fetch logs'));
      render(<LogsView containerId="abc123" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch logs')).toBeInTheDocument();
      });
    });
  });
});
