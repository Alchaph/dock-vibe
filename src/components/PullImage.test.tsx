import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PullImage from './PullImage';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const onClose = vi.fn();
const onSuccess = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockResolvedValue(undefined);
});

describe('PullImage', () => {
  it('renders pull image modal', () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText('Pull Docker Image')).toBeInTheDocument();
    expect(screen.getByLabelText('Image Name')).toBeInTheDocument();
  });

  it('shows placeholder with examples', () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Image Name');
    expect(input).toHaveAttribute('placeholder', 'e.g., nginx:latest, postgres:15, redis:alpine');
  });

  it('pulls image on form submit', async () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Image Name');
    await userEvent.type(input, 'nginx:latest');
    await userEvent.click(screen.getByText('Pull Image'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('pull_image', { name: 'nginx:latest' });
    });
  });

  it('calls onSuccess and onClose after successful pull', async () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Image Name');
    await userEvent.type(input, 'redis:alpine');
    await userEvent.click(screen.getByText('Pull Image'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error on pull failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Image not found'));
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Image Name');
    await userEvent.type(input, 'nonexistent:image');
    await userEvent.click(screen.getByText('Pull Image'));

    await waitFor(() => {
      expect(screen.getByText('Image not found')).toBeInTheDocument();
    });
  });

  it('shows pulling state', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    const input = screen.getByLabelText('Image Name');
    await userEvent.type(input, 'nginx:latest');
    await userEvent.click(screen.getByText('Pull Image'));

    await waitFor(() => {
      expect(screen.getByText('Pulling...')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates empty input', async () => {
    render(<PullImage onClose={onClose} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByText('Pull Image'));

    expect(screen.getByText('Please enter an image name')).toBeInTheDocument();
    expect(mockInvoke).not.toHaveBeenCalledWith('pull_image', expect.anything());
  });
});
