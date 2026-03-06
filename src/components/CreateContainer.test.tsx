import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateContainer from './CreateContainer';
import { invoke } from '@tauri-apps/api/core';
import type { ContainerTemplate } from './Templates';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockImages = [
  { id: 'sha256:abc123', repo_tags: ['nginx:latest'], size: 100000, created: 1700000000 },
  { id: 'sha256:def456', repo_tags: ['postgres:15'], size: 200000, created: 1699000000 },
];

const mockTemplate: ContainerTemplate = {
  id: 'postgres',
  name: 'PostgreSQL',
  description: 'PostgreSQL database',
  color: '#336791',
  image: 'postgres:15',
  ports: [{ containerPort: '5432/tcp', hostPort: '5432' }],
  volumes: [{ source: 'postgres-data', target: '/var/lib/postgresql/data', readonly: false }],
  envVars: [
    { key: 'POSTGRES_PASSWORD', value: 'postgres' },
    { key: 'POSTGRES_USER', value: 'postgres' },
  ],
  network: 'bridge',
  restartPolicy: 'unless-stopped',
  command: '',
  memoryLimit: '512',
  cpuLimit: '1',
};

const onClose = vi.fn();
const onCreated = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'list_images') return mockImages;
    if (cmd === 'create_container') return 'new-container-id';
    if (cmd === 'create_and_start_container') return 'new-container-id';
    return undefined;
  });
});

describe('CreateContainer', () => {
  describe('basic rendering', () => {
    it('renders create container modal', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Container' })).toBeInTheDocument();
      });
    });

    it('shows image selector with loaded images', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        expect(screen.getByText('nginx:latest')).toBeInTheDocument();
        expect(screen.getByText('postgres:15')).toBeInTheDocument();
      });
    });

    it('shows all form sections', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        expect(screen.getByText('Basic Configuration')).toBeInTheDocument();
        expect(screen.getByText('Port Mappings')).toBeInTheDocument();
        expect(screen.getByText('Volume Mounts')).toBeInTheDocument();
        expect(screen.getByText('Environment Variables')).toBeInTheDocument();
        expect(screen.getByText('Advanced Options')).toBeInTheDocument();
      });
    });
  });

  describe('template mode', () => {
    it('shows template name in title', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => {
        expect(screen.getByText('Create Container - PostgreSQL')).toBeInTheDocument();
      });
    });

    it('pre-fills template ports', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => {
        const portInputs = screen.getAllByPlaceholderText('Host Port');
        expect((portInputs[0] as HTMLInputElement).value).toBe('5432');
      });
    });

    it('pre-fills template environment variables', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => {
        const keyInputs = screen.getAllByPlaceholderText('KEY');
        expect((keyInputs[0] as HTMLInputElement).value).toBe('POSTGRES_PASSWORD');
      });
    });
  });

  describe('dynamic form elements', () => {
    it('adds port mapping row', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => screen.getByText('+ Add Port'));
      await userEvent.click(screen.getByText('+ Add Port'));

      expect(screen.getByPlaceholderText('Host Port')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Container Port (e.g., 80/tcp)')).toBeInTheDocument();
    });

    it('adds environment variable row', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => screen.getByText('+ Add Variable'));
      await userEvent.click(screen.getByText('+ Add Variable'));

      expect(screen.getByPlaceholderText('KEY')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('value')).toBeInTheDocument();
    });

    it('adds volume mount row', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => screen.getByText('+ Add Volume'));
      await userEvent.click(screen.getByText('+ Add Volume'));

      expect(screen.getByPlaceholderText('Source (volume name or host path)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Container Path')).toBeInTheDocument();
    });
  });

  describe('advanced options', () => {
    it('has network selector', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Network')).toBeInTheDocument();
      });
    });

    it('has restart policy selector', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        const select = screen.getByLabelText('Restart Policy');
        expect(select).toBeInTheDocument();

        const options = select.querySelectorAll('option');
        const values = Array.from(options).map(o => o.value);
        expect(values).toContain('no');
        expect(values).toContain('always');
        expect(values).toContain('unless-stopped');
        expect(values).toContain('on-failure');
      });
    });

    it('has memory and CPU limit inputs', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Memory Limit (MB, optional)')).toBeInTheDocument();
        expect(screen.getByLabelText('CPU Limit (cores, optional)')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls createContainer for non-template creation', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => screen.getByLabelText('Image *'));

      const imageSelect = screen.getByLabelText('Image *');
      await userEvent.selectOptions(imageSelect, 'nginx:latest');

      await userEvent.click(screen.getByRole('button', { name: 'Create Container' }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('create_container', expect.objectContaining({
          request: expect.objectContaining({ image: 'nginx:latest' }),
        }));
      });
    });

    it('calls createAndStartContainer for template creation', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => screen.getByRole('button', { name: 'Create Container' }));
      await userEvent.click(screen.getByRole('button', { name: 'Create Container' }));

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('create_and_start_container', expect.objectContaining({
          request: expect.objectContaining({ image: 'postgres:15' }),
        }));
      });
    });

    it('calls onCreated and onClose on success', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => screen.getByRole('button', { name: 'Create Container' }));
      await userEvent.click(screen.getByRole('button', { name: 'Create Container' }));

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('shows error on creation failure', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'list_images') return mockImages;
        if (cmd === 'create_and_start_container') throw new Error('Port already in use');
        return undefined;
      });

      render(<CreateContainer onClose={onClose} onCreated={onCreated} template={mockTemplate} />);

      await waitFor(() => screen.getByRole('button', { name: 'Create Container' }));
      await userEvent.click(screen.getByRole('button', { name: 'Create Container' }));

      await waitFor(() => {
        expect(screen.getByText('Port already in use')).toBeInTheDocument();
      });
    });
  });

  describe('modal behavior', () => {
    it('calls onClose when cancel is clicked', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => screen.getByText('Cancel'));
      await userEvent.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', async () => {
      render(<CreateContainer onClose={onClose} onCreated={onCreated} />);

      await waitFor(() => {
        const closeBtn = screen.getByText('X');
        userEvent.click(closeBtn);
      });
    });
  });
});
