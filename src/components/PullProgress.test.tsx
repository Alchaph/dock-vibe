import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PullProgress from './PullProgress';
import { listen, type Event } from '@tauri-apps/api/event';
import type { PullProgressEvent } from '../types';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

const mockListen = vi.mocked(listen);

const onClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PullProgress', () => {
  it('renders with image name in heading', async () => {
    mockListen.mockResolvedValue(() => {});
    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    expect(screen.getByText('PULLING: nginx:latest')).toBeInTheDocument();
  });

  it('shows INITIALIZING... as initial overall status', async () => {
    mockListen.mockResolvedValue(() => {});
    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('INITIALIZING...')).toBeInTheDocument();
    });
  });

  it('CANCEL button is always enabled so user can dismiss', async () => {
    mockListen.mockResolvedValue(() => {});
    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('CANCEL');
    });
  });

  it('shows CANCEL text on button when not complete', async () => {
    mockListen.mockResolvedValue(() => {});
    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('CANCEL');
    });
  });

  it('when completion event fires, shows PULL COMPLETE and enables CLOSE button', async () => {
    let eventCallback: ((event: Event<PullProgressEvent>) => void) | null = null;

    mockListen.mockImplementation((_eventName, handler) => {
      eventCallback = handler as typeof eventCallback;
      return Promise.resolve(() => {});
    });

    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(eventCallback).not.toBeNull();
    });

    act(() => {
      eventCallback!({
        event: 'pull-progress',
        id: 0,
        payload: {
          image: 'nginx:latest',
          id: null,
          status: 'Pull complete',
          progress: null,
          current: null,
          total: null,
          complete: true,
          error: null,
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('PULL COMPLETE')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('CLOSE');
  });

  it('when error event fires, shows ERROR: ... text and enables CLOSE button', async () => {
    let eventCallback: ((event: Event<PullProgressEvent>) => void) | null = null;

    mockListen.mockImplementation((_eventName, handler) => {
      eventCallback = handler as typeof eventCallback;
      return Promise.resolve(() => {});
    });

    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(eventCallback).not.toBeNull();
    });

    act(() => {
      eventCallback!({
        event: 'pull-progress',
        id: 0,
        payload: {
          image: 'nginx:latest',
          id: null,
          status: '',
          progress: null,
          current: null,
          total: null,
          complete: false,
          error: 'Connection timeout',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('ERROR: Connection timeout')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('CLOSE');
  });

  it('when layer progress events fire, shows layer IDs and progress bars', async () => {
    let eventCallback: ((event: Event<PullProgressEvent>) => void) | null = null;

    mockListen.mockImplementation((_eventName, handler) => {
      eventCallback = handler as typeof eventCallback;
      return Promise.resolve(() => {});
    });

    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(eventCallback).not.toBeNull();
    });

    act(() => {
      eventCallback!({
        event: 'pull-progress',
        id: 1,
        payload: {
          image: 'nginx:latest',
          id: 'abc123def456',
          status: 'Downloading',
          progress: null,
          current: 1024,
          total: 10240,
          complete: false,
          error: null,
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('abc123def456')).toBeInTheDocument();
      expect(screen.getByText('DOWNLOADING')).toBeInTheDocument();
    });

    const progressBar = document.querySelector('.progress-bar-fill');
    expect(progressBar).toBeInTheDocument();
  });

  it('calls onClose when CLOSE button is clicked after completion', async () => {
    let eventCallback: ((event: Event<PullProgressEvent>) => void) | null = null;

    mockListen.mockImplementation((_eventName, handler) => {
      eventCallback = handler as typeof eventCallback;
      return Promise.resolve(() => {});
    });

    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(eventCallback).not.toBeNull();
    });

    act(() => {
      eventCallback!({
        event: 'pull-progress',
        id: 0,
        payload: {
          image: 'nginx:latest',
          id: null,
          status: 'Pull complete',
          progress: null,
          current: null,
          total: null,
          complete: true,
          error: null,
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('PULL COMPLETE')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onStartPull after event listener is registered', async () => {
    const onStartPull = vi.fn();

    mockListen.mockImplementation(() => {
      return Promise.resolve(() => {});
    });

    render(<PullProgress imageName="nginx:latest" onClose={onClose} onStartPull={onStartPull} />);

    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('pull-progress', expect.any(Function));
      expect(onStartPull).toHaveBeenCalledTimes(1);
    });
  });

  it('does not error when onStartPull is not provided', async () => {
    mockListen.mockResolvedValue(() => {});
    render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('pull-progress', expect.any(Function));
    });
  });

  it('cleans up event listener on unmount', async () => {
    const mockUnlisten = vi.fn();
    let eventCallback: ((event: Event<PullProgressEvent>) => void) | null = null;

    mockListen.mockImplementation((_eventName, handler) => {
      eventCallback = handler as typeof eventCallback;
      return Promise.resolve(mockUnlisten);
    });

    const { unmount } = render(<PullProgress imageName="nginx:latest" onClose={onClose} />);

    await waitFor(() => {
      expect(eventCallback).not.toBeNull();
    });

    unmount();

    expect(mockUnlisten).toHaveBeenCalled();
  });
});
