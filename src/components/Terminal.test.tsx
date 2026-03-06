import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';

const mockTerminalInstance = {
  loadAddon: vi.fn(),
  open: vi.fn(),
  write: vi.fn(),
  onData: vi.fn(),
  onResize: vi.fn(),
  dispose: vi.fn(),
};

const mockFitAddonInstance = {
  fit: vi.fn(),
};

vi.mock('@xterm/xterm', () => {
  return {
    Terminal: class MockTerminal {
      loadAddon = mockTerminalInstance.loadAddon;
      open = mockTerminalInstance.open;
      write = mockTerminalInstance.write;
      onData = mockTerminalInstance.onData;
      onResize = mockTerminalInstance.onResize;
      dispose = mockTerminalInstance.dispose;
      options: Record<string, unknown>;
      constructor(options?: Record<string, unknown>) {
        this.options = options || {};
        MockTerminal._lastInstance = this;
        MockTerminal._lastOptions = options;
      }
      static _lastInstance: MockTerminal | null = null;
      static _lastOptions: Record<string, unknown> | undefined = undefined;
    },
  };
});

vi.mock('@xterm/addon-fit', () => {
  return {
    FitAddon: class MockFitAddon {
      fit = mockFitAddonInstance.fit;
    },
  };
});

vi.mock('@xterm/xterm/css/xterm.css', () => ({}));

import Terminal from './Terminal';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockResolvedValue('exec-123');
});

describe('Terminal', () => {
  const defaultProps = {
    containerId: 'container-abc123',
    containerName: 'nginx-web',
    onClose: vi.fn(),
  };

  it('renders terminal header with container name', () => {
    render(<Terminal {...defaultProps} />);
    expect(screen.getByText('nginx-web — Terminal')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<Terminal {...defaultProps} />);
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toHaveTextContent('×');
  });

  it('calls onClose when close button clicked', () => {
    render(<Terminal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows connecting state initially', () => {
    mockInvoke.mockReturnValue(new Promise(() => {}));
    render(<Terminal {...defaultProps} />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('calls start_terminal on mount', async () => {
    render(<Terminal {...defaultProps} />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('start_terminal', expect.objectContaining({
        containerId: 'container-abc123',
      }));
    });
  });

  it('calls close_terminal on unmount', () => {
    const { unmount } = render(<Terminal {...defaultProps} />);
    unmount();
    expect(mockInvoke).toHaveBeenCalledWith('close_terminal', {
      containerId: 'container-abc123',
    });
  });

  it('shows error when terminal connection fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Container not running'));
    render(<Terminal {...defaultProps} />);
    const errorEl = await screen.findByText('Container not running');
    expect(errorEl).toBeInTheDocument();
  });

  it('renders terminal content div', () => {
    render(<Terminal {...defaultProps} />);
    const container = document.querySelector('.terminal-content');
    expect(container).toBeInTheDocument();
  });

  it('creates xterm instance with correct config', async () => {
    const { Terminal: XTermMock } = await import('@xterm/xterm');
    render(<Terminal {...defaultProps} />);
    const MockClass = XTermMock as unknown as { _lastOptions: Record<string, unknown> };
    expect(MockClass._lastOptions).toEqual(expect.objectContaining({
      cursorBlink: true,
      fontSize: 14,
    }));
  });
});
