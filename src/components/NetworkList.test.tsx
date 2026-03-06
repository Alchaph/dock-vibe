import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NetworkList from './NetworkList';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);
const mockOnToast = vi.fn();

const mockNetworks = [
  { id: 'net1abc', name: 'bridge', driver: 'bridge', scope: 'local' },
  { id: 'net2def', name: 'host', driver: 'host', scope: 'local' },
  { id: 'net3ghi', name: 'none', driver: 'null', scope: 'local' },
  { id: 'net4jkl123456', name: 'my-network', driver: 'bridge', scope: 'local' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_networks') return mockNetworks;
    if (cmd === 'create_network') return 'new-net-id';
    return undefined;
  });
});

describe('NetworkList', () => {
  it('renders network table with all networks', async () => {
    render(<NetworkList onToast={mockOnToast} />);

    await waitFor(() => {
      expect(screen.getByText('my-network')).toBeInTheDocument();
    });
  });

  it('shows system label for default networks', async () => {
    render(<NetworkList onToast={mockOnToast} />);

    await waitFor(() => {
      const systemLabels = screen.getAllByText('System');
      expect(systemLabels.length).toBe(3);
    });
  });

  it('shows remove button only for non-default networks', async () => {
    render(<NetworkList onToast={mockOnToast} />);

    await waitFor(() => screen.getByText('my-network'));

    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons.length).toBe(1);
  });

  it('shows empty state when no networks', async () => {
    mockInvoke.mockResolvedValue([]);
    render(<NetworkList onToast={mockOnToast} />);

    await waitFor(() => {
      expect(screen.getByText('No Networks Found')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<NetworkList onToast={mockOnToast} />);

    expect(screen.getByText('Loading networks...')).toBeInTheDocument();
  });

  describe('create network modal', () => {
    it('opens create network modal', async () => {
      render(<NetworkList onToast={mockOnToast} />);

      await waitFor(() => screen.getByText('Create Network'));
      await userEvent.click(screen.getByText('Create Network'));

      expect(screen.getByLabelText('Network Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Driver')).toBeInTheDocument();
    });

    it('has driver options', async () => {
      render(<NetworkList onToast={mockOnToast} />);

      await waitFor(() => screen.getByText('Create Network'));
      await userEvent.click(screen.getByText('Create Network'));

      const driverSelect = screen.getByLabelText('Driver');
      expect(driverSelect).toBeInTheDocument();

      const options = driverSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map(o => o.value);
      expect(optionValues).toContain('bridge');
      expect(optionValues).toContain('host');
      expect(optionValues).toContain('overlay');
      expect(optionValues).toContain('macvlan');
      expect(optionValues).toContain('none');
    });

    it('creates network on form submit', async () => {
      render(<NetworkList onToast={mockOnToast} />);

      await waitFor(() => screen.getByText('Create Network'));
      await userEvent.click(screen.getByText('Create Network'));

      const nameInput = screen.getByLabelText('Network Name');
      await userEvent.type(nameInput, 'test-network');

      const createButtons = screen.getAllByText('Create');
      const submitBtn = createButtons.find(btn => btn.tagName === 'BUTTON' && btn.getAttribute('type') === 'submit');
      if (submitBtn) await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('create_network', { name: 'test-network', driver: 'bridge' });
      });
    });
  });

  describe('remove network', () => {
    it('removes non-default network when confirmed', async () => {
      render(<NetworkList onToast={mockOnToast} />);

      await waitFor(() => screen.getByText('my-network'));

      await userEvent.click(screen.getByText('Remove'));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('remove_network', { id: 'net4jkl123456' });
      });
    });
  });

  describe('error handling', () => {
    it('shows empty state on load failure', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'list_networks') throw new Error('Network error');
        return undefined;
      });
      render(<NetworkList onToast={mockOnToast} />);

      await waitFor(() => {
        expect(screen.getByText('No Networks Found')).toBeInTheDocument();
      });
    });
  });
});
