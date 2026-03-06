import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContainerList from './ContainerList';
import type { ContainerInfo } from '../types';

const mockContainers: ContainerInfo[] = [
  {
    id: 'abc123def456',
    name: 'nginx-web',
    image: 'nginx:latest',
    state: 'running',
    status: 'Up 2 hours',
    ports: [
      { ip: '0.0.0.0', private_port: 80, public_port: 8080, port_type: 'tcp' },
      { ip: '0.0.0.0', private_port: 443, public_port: 8443, port_type: 'tcp' },
      { ip: '0.0.0.0', private_port: 9090, port_type: 'tcp' },
    ],
    created: 1700000000,
  },
  {
    id: 'def456ghi789',
    name: 'postgres-db',
    image: 'postgres:15',
    state: 'exited',
    status: 'Exited (0) 3 hours ago',
    ports: [],
    created: 1699000000,
  },
  {
    id: 'ghi789jkl012',
    name: 'redis-cache',
    image: 'redis:alpine',
    state: 'paused',
    status: 'Up 1 hour (Paused)',
    ports: [{ ip: '0.0.0.0', private_port: 6379, public_port: 6379, port_type: 'tcp' }],
    created: 1698000000,
  },
];

const defaultProps = {
  containers: mockContainers,
  onAction: vi.fn(),
  onViewDetails: vi.fn(),
  onViewLogs: vi.fn(),
  loading: false,
};

describe('ContainerList', () => {
  it('renders container table with all containers', () => {
    render(<ContainerList {...defaultProps} />);

    expect(screen.getByText('nginx-web')).toBeInTheDocument();
    expect(screen.getByText('postgres-db')).toBeInTheDocument();
    expect(screen.getByText('redis-cache')).toBeInTheDocument();
  });

  it('shows stats bar with correct counts', () => {
    render(<ContainerList {...defaultProps} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty state when no containers', () => {
    render(<ContainerList {...defaultProps} containers={[]} />);

    expect(screen.getByText('No containers found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ContainerList {...defaultProps} containers={[]} loading={true} />);

    expect(screen.getByText('Loading containers...')).toBeInTheDocument();
  });

  it('renders port mappings correctly', () => {
    render(<ContainerList {...defaultProps} />);

    expect(screen.getByText('8080:80')).toBeInTheDocument();
    expect(screen.getByText('8443:443')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows correct action buttons for running containers', () => {
    render(<ContainerList {...defaultProps} />);

    const stopButtons = screen.getAllByTitle('Stop');
    expect(stopButtons.length).toBe(1);

    const restartButtons = screen.getAllByTitle('Restart');
    expect(restartButtons.length).toBe(1);

    const logsButtons = screen.getAllByTitle('Logs');
    expect(logsButtons.length).toBe(1);
  });

  it('shows correct action buttons for stopped containers', () => {
    render(<ContainerList {...defaultProps} />);

    const startButtons = screen.getAllByTitle('Start');
    expect(startButtons.length).toBe(1);

    const removeButtons = screen.getAllByTitle('Remove');
    expect(removeButtons.length).toBe(1);
  });

  it('shows unpause button for paused containers', () => {
    render(<ContainerList {...defaultProps} />);

    const unpauseButtons = screen.getAllByTitle('Unpause');
    expect(unpauseButtons.length).toBe(1);
  });

  it('calls onAction when action button is clicked', async () => {
    render(<ContainerList {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Stop'));
    expect(defaultProps.onAction).toHaveBeenCalledWith('stop', 'abc123def456');
  });

  it('calls onViewDetails when container name is clicked', async () => {
    render(<ContainerList {...defaultProps} />);

    fireEvent.click(screen.getByText('nginx-web'));
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('abc123def456');
  });

  it('calls onViewLogs when logs button is clicked', () => {
    render(<ContainerList {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Logs'));
    expect(defaultProps.onViewLogs).toHaveBeenCalledWith('abc123def456');
  });

  describe('search functionality', () => {
    it('filters containers by name', async () => {
      render(<ContainerList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search containers by name, image, ID, or status...');
      await userEvent.type(searchInput, 'nginx');

      expect(screen.getByText('nginx-web')).toBeInTheDocument();
      expect(screen.queryByText('postgres-db')).not.toBeInTheDocument();
    });

    it('filters containers by image', async () => {
      render(<ContainerList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search containers by name, image, ID, or status...');
      await userEvent.type(searchInput, 'postgres');

      expect(screen.getByText('postgres-db')).toBeInTheDocument();
      expect(screen.queryByText('nginx-web')).not.toBeInTheDocument();
    });

    it('filters containers by state', async () => {
      render(<ContainerList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search containers by name, image, ID, or status...');
      await userEvent.type(searchInput, 'paused');

      expect(screen.getByText('redis-cache')).toBeInTheDocument();
      expect(screen.queryByText('nginx-web')).not.toBeInTheDocument();
    });

    it('shows no match message when search has no results', async () => {
      render(<ContainerList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search containers by name, image, ID, or status...');
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('No containers match your search')).toBeInTheDocument();
    });

    it('clears search with clear button', async () => {
      render(<ContainerList {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search containers by name, image, ID, or status...');
      await userEvent.type(searchInput, 'nginx');

      expect(screen.queryByText('postgres-db')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTitle('Clear search'));
      expect(screen.getByText('postgres-db')).toBeInTheDocument();
    });
  });
});
