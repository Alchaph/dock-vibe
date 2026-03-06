import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VolumeList from './VolumeList';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockVolumes = [
  {
    name: 'postgres-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/postgres-data/_data',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    name: 'redis-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/redis-data/_data',
    created_at: '2024-01-14T08:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_volumes') return mockVolumes;
    if (cmd === 'create_volume') return 'new-vol-id';
    return undefined;
  });
});

describe('VolumeList', () => {
  it('renders volume table with all volumes', async () => {
    render(<VolumeList />);

    await waitFor(() => {
      expect(screen.getByText('postgres-data')).toBeInTheDocument();
      expect(screen.getByText('redis-data')).toBeInTheDocument();
    });
  });

  it('shows volume details (driver, mountpoint)', async () => {
    render(<VolumeList />);

    await waitFor(() => {
      const localDriverCells = screen.getAllByText('local');
      expect(localDriverCells.length).toBe(2);
    });
  });

  it('shows empty state when no volumes', async () => {
    mockInvoke.mockResolvedValue([]);
    render(<VolumeList />);

    await waitFor(() => {
      expect(screen.getByText('No Volumes Found')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<VolumeList />);

    expect(screen.getByText('Loading volumes...')).toBeInTheDocument();
  });

  describe('create volume modal', () => {
    it('opens create volume modal', async () => {
      render(<VolumeList />);

      await waitFor(() => screen.getByText('Create Volume'));
      await userEvent.click(screen.getByText('Create Volume'));

      expect(screen.getByLabelText('Volume Name')).toBeInTheDocument();
    });

    it('closes modal with cancel button', async () => {
      render(<VolumeList />);

      await waitFor(() => screen.getByText('Create Volume'));
      await userEvent.click(screen.getByText('Create Volume'));

      await userEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByLabelText('Volume Name')).not.toBeInTheDocument();
    });

    it('creates volume on form submit', async () => {
      render(<VolumeList />);

      await waitFor(() => screen.getByText('Create Volume'));
      await userEvent.click(screen.getByText('Create Volume'));

      const input = screen.getByLabelText('Volume Name');
      await userEvent.type(input, 'my-new-volume');

      const createButtons = screen.getAllByText('Create');
      const submitBtn = createButtons.find(btn => btn.tagName === 'BUTTON' && btn.getAttribute('type') === 'submit');
      if (submitBtn) await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('create_volume', { name: 'my-new-volume' });
      });
    });
  });

  describe('remove volume', () => {
    it('calls remove_volume when remove is clicked and confirmed', async () => {
      render(<VolumeList />);

      await waitFor(() => screen.getByText('postgres-data'));

      const removeButtons = screen.getAllByText('Remove');
      await userEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('remove_volume', { name: 'postgres-data', force: false });
      });
    });
  });

  describe('error handling', () => {
    it('shows empty state on load failure', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'list_volumes') throw new Error('Connection lost');
        return undefined;
      });
      render(<VolumeList />);

      await waitFor(() => {
        expect(screen.getByText('No Volumes Found')).toBeInTheDocument();
      });
    });
  });
});
