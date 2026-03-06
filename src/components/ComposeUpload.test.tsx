import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeUpload from './ComposeUpload';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const onClose = vi.fn();
const onSuccess = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const sampleCompose = `version: "3"
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret`;

describe('ComposeUpload', () => {
  it('renders compose upload modal', () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText('Deploy Docker Compose')).toBeInTheDocument();
  });

  it('shows file input for compose files', () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText(/Select compose.yml/)).toBeInTheDocument();
  });

  it('shows deploy button disabled when no content', () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const deployBtn = screen.getByText('Deploy');
    expect(deployBtn).toBeDisabled();
  });

  it('processes uploaded file', async () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const file = new File([sampleCompose], 'docker-compose.yml', { type: 'text/yaml' });
    const input = document.querySelector('input[type="file"]')!;

    fireEvent.change(input, { target: { files: [file] } });

    // FileReader is async, need to wait
    await vi.waitFor(() => {
      expect(screen.getByText('Preview:')).toBeInTheDocument();
    });
  });

  it('deploys compose and shows results', async () => {
    const deployResults = [
      { service_name: 'web', container_id: 'web123', success: true },
      { service_name: 'db', container_id: 'db456', success: true },
    ];
    mockInvoke.mockResolvedValue(deployResults);

    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const file = new File([sampleCompose], 'docker-compose.yml', { type: 'text/yaml' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => screen.getByText('Preview:'));

    await userEvent.click(screen.getByText('Deploy'));

    await vi.waitFor(() => {
      expect(screen.getByText('Deployment Results')).toBeInTheDocument();
      expect(screen.getByText('web')).toBeInTheDocument();
      expect(screen.getByText('db')).toBeInTheDocument();
    });
  });

  it('shows success and failure counts', async () => {
    const deployResults = [
      { service_name: 'web', container_id: 'web123', success: true },
      { service_name: 'db', success: false, error: 'Image not found' },
    ];
    mockInvoke.mockResolvedValue(deployResults);

    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const file = new File([sampleCompose], 'docker-compose.yml', { type: 'text/yaml' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => screen.getByText('Preview:'));
    await userEvent.click(screen.getByText('Deploy'));

    await vi.waitFor(() => {
      expect(screen.getByText('Error: Image not found')).toBeInTheDocument();
    });
  });

  it('shows Start All button after successful deploy', async () => {
    const deployResults = [
      { service_name: 'web', container_id: 'web123', success: true },
    ];
    mockInvoke.mockResolvedValue(deployResults);

    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const file = new File([sampleCompose], 'docker-compose.yml', { type: 'text/yaml' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => screen.getByText('Preview:'));
    await userEvent.click(screen.getByText('Deploy'));

    await vi.waitFor(() => {
      expect(screen.getByText('Start All Containers')).toBeInTheDocument();
    });
  });

  it('shows error on deploy failure', async () => {
    mockInvoke.mockRejectedValue(new Error('Invalid YAML'));

    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    const file = new File([sampleCompose], 'docker-compose.yml', { type: 'text/yaml' });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => screen.getByText('Preview:'));
    await userEvent.click(screen.getByText('Deploy'));

    await vi.waitFor(() => {
      expect(screen.getByText('Invalid YAML')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<ComposeUpload onClose={onClose} onSuccess={onSuccess} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
