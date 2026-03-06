import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemPrune from './SystemPrune';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  Channel: class MockChannel {
    onmessage: ((msg: unknown) => void) | null = null;
  },
}));

const mockInvoke = vi.mocked(invoke);

const onClose = vi.fn();
const onPruned = vi.fn();

const mockPruneResult = {
  containers_removed: 3,
  images_removed: 5,
  volumes_removed: 0,
  networks_removed: 2,
  space_reclaimed: 524288000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockResolvedValue(mockPruneResult);
});

describe('SystemPrune', () => {
  it('renders system prune modal', () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    expect(screen.getByText('System Prune')).toBeInTheDocument();
    expect(screen.getByText('Prune')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows warning message', () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    expect(screen.getByText(/stopped containers/)).toBeInTheDocument();
  });

  it('has volume prune checkbox unchecked by default', () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    const checkbox = screen.getByLabelText('Also prune unused volumes');
    expect(checkbox).not.toBeChecked();
  });

  it('shows volume warning when checkbox is checked', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByLabelText('Also prune unused volumes'));

    expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();
  });

  it('calls systemPrune without volumes by default', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('system_prune', { pruneVolumes: false });
    });
  });

  it('calls systemPrune with volumes when checked', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByLabelText('Also prune unused volumes'));
    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('system_prune', { pruneVolumes: true });
    });
  });

  it('shows results after successful prune', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('items removed')).toBeInTheDocument();
      expect(screen.getByText('500 MB reclaimed')).toBeInTheDocument();
    });
  });

  it('shows result breakdown table', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(screen.getByText('Containers')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Images')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Networks')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('calls onPruned after successful prune', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(onPruned).toHaveBeenCalled();
    });
  });

  it('shows Done button after prune completes', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error on prune failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Permission denied'));
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables buttons while pruning', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<SystemPrune onClose={onClose} onPruned={onPruned} />);

    await userEvent.click(screen.getByText('Prune'));

    await waitFor(() => {
      expect(screen.getByText('Pruning...')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });
});
