import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ContainerDetailsView from './ContainerDetailsView';
import { invoke } from '@tauri-apps/api/core';
import type { ContainerDetails } from '../types';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const runningDetails: ContainerDetails = {
  id: 'abc123def456789',
  name: 'nginx-web',
  image: 'nginx:latest',
  state: 'running',
  status: 'Up 2 hours',
  created: '2024-01-15T10:30:00Z',
  ports: [
    { ip: '0.0.0.0', private_port: 80, public_port: 8080, port_type: 'tcp' },
  ],
  mounts: [
    { mount_type: 'volume', source: 'nginx-data', destination: '/usr/share/nginx/html', mode: 'rw', rw: true },
  ],
  env: ['NGINX_HOST=localhost', 'NGINX_PORT=80'],
  network_settings: {
    networks: { bridge: '172.17.0.2' },
  },
};

const stoppedDetails: ContainerDetails = {
  ...runningDetails,
  state: 'exited',
  status: 'Exited (0)',
};

const onAction = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockResolvedValue({
    cpu_usage: 12.5,
    memory_usage: 52428800,
    memory_limit: 1073741824,
    memory_percent: 4.9,
    network_rx: 10240,
    network_tx: 5120,
  });
});

describe('ContainerDetailsView', () => {
  describe('general information', () => {
    it('renders container name as heading', async () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('nginx-web')).toBeInTheDocument();
    });

    it('shows container ID (truncated)', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('abc123def456')).toBeInTheDocument();
    });

    it('shows image name', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('nginx:latest')).toBeInTheDocument();
    });

    it('shows container state', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('disables start button when container is running', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      const startBtn = screen.getByText('Start');
      expect(startBtn).toBeDisabled();
    });

    it('enables stop button when container is running', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      const stopBtn = screen.getByText('Stop');
      expect(stopBtn).not.toBeDisabled();
    });

    it('enables start button when container is stopped', () => {
      render(<ContainerDetailsView details={stoppedDetails} onAction={onAction} />);
      const startBtn = screen.getByText('Start');
      expect(startBtn).not.toBeDisabled();
    });

    it('disables stop button when container is stopped', () => {
      render(<ContainerDetailsView details={stoppedDetails} onAction={onAction} />);
      const stopBtn = screen.getByText('Stop');
      expect(stopBtn).toBeDisabled();
    });
  });

  describe('resource stats', () => {
    it('shows resource usage for running containers', async () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);

      await waitFor(() => {
        expect(screen.getByText('Resource Usage')).toBeInTheDocument();
        expect(screen.getByText('12.50%')).toBeInTheDocument();
      });
    });

    it('does not show resource usage for stopped containers', async () => {
      mockInvoke.mockResolvedValue(null);
      render(<ContainerDetailsView details={stoppedDetails} onAction={onAction} />);

      await waitFor(() => {
        expect(screen.queryByText('Resource Usage')).not.toBeInTheDocument();
      });
    });
  });

  describe('port mappings', () => {
    it('shows port mappings table', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('Port Mappings')).toBeInTheDocument();
      const portCells = screen.getAllByText('80');
      expect(portCells.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('8080')).toBeInTheDocument();
    });

    it('shows "No port mappings" when none exist', () => {
      const noPorts = { ...runningDetails, ports: [] };
      render(<ContainerDetailsView details={noPorts} onAction={onAction} />);
      expect(screen.getByText('No port mappings')).toBeInTheDocument();
    });
  });

  describe('volume mounts', () => {
    it('shows mount information', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('Volume Mounts')).toBeInTheDocument();
      expect(screen.getByText('/usr/share/nginx/html')).toBeInTheDocument();
    });

    it('shows "No volume mounts" when none exist', () => {
      const noMounts = { ...runningDetails, mounts: [] };
      render(<ContainerDetailsView details={noMounts} onAction={onAction} />);
      expect(screen.getByText('No volume mounts')).toBeInTheDocument();
    });
  });

  describe('environment variables', () => {
    it('renders environment variables', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('Environment Variables')).toBeInTheDocument();
      expect(screen.getByText('NGINX_HOST')).toBeInTheDocument();
      expect(screen.getByText('localhost')).toBeInTheDocument();
    });

    it('shows "No environment variables" when none exist', () => {
      const noEnv = { ...runningDetails, env: [] };
      render(<ContainerDetailsView details={noEnv} onAction={onAction} />);
      expect(screen.getByText('No environment variables')).toBeInTheDocument();
    });
  });

  describe('networks', () => {
    it('shows network information', () => {
      render(<ContainerDetailsView details={runningDetails} onAction={onAction} />);
      expect(screen.getByText('bridge')).toBeInTheDocument();
      expect(screen.getByText('172.17.0.2')).toBeInTheDocument();
    });

    it('shows "No networks" when none exist', () => {
      const noNetworks = { ...runningDetails, network_settings: { networks: {} } };
      render(<ContainerDetailsView details={noNetworks} onAction={onAction} />);
      expect(screen.getByText('No networks')).toBeInTheDocument();
    });
  });
});
