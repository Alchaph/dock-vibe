import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

function setupConnectedApp() {
  const containers = [
    {
      id: 'c1',
      name: 'nginx-web',
      image: 'nginx:latest',
      state: 'running',
      status: 'Up 2 hours',
      ports: [{ ip: '0.0.0.0', private_port: 80, public_port: 8080, port_type: 'tcp' }],
      created: 1700000000,
    },
    {
      id: 'c2',
      name: 'postgres-db',
      image: 'postgres:15',
      state: 'exited',
      status: 'Exited (0)',
      ports: [],
      created: 1699000000,
    },
  ];

  mockInvoke.mockImplementation(async (cmd: string) => {
    switch (cmd) {
      case 'check_docker_connection': return true;
      case 'list_containers': return containers;
      case 'list_images': return [];
      case 'list_volumes': return [];
      case 'list_networks': return [];
      default: return undefined;
    }
  });

  return containers;
}

describe('App', () => {
  describe('Docker connection', () => {
    it('shows connection error when Docker is not running', async () => {
      mockInvoke.mockRejectedValue(new Error('Connection refused'));
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Docker Connection Failed')).toBeInTheDocument();
      });
    });

    it('shows retry button on connection failure', async () => {
      mockInvoke.mockRejectedValue(new Error('Connection refused'));
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });
    });

    it('renders main app when Docker is connected', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('DOCK')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('renders all navigation buttons', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Templates')).toBeInTheDocument();
        expect(screen.getByText('Containers')).toBeInTheDocument();
        expect(screen.getByText('Images')).toBeInTheDocument();
        expect(screen.getByText('Volumes')).toBeInTheDocument();
        expect(screen.getByText('Networks')).toBeInTheDocument();
      });
    });

    it('starts on templates view', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => {
        const templatesBtn = screen.getByText('Templates');
        expect(templatesBtn).toHaveClass('active');
      });
    });

    it('switches to containers view', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => screen.getByText('Containers'));
      await userEvent.click(screen.getByText('Containers'));

      await waitFor(() => {
        expect(screen.getByText('Containers')).toHaveClass('active');
      });
    });
  });

  describe('dark mode', () => {
    it('toggles dark mode', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => screen.getByText('Dark'));
      const toggleBtn = screen.getByText('Dark');
      await userEvent.click(toggleBtn);

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    it('persists dark mode to localStorage', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => screen.getByText('Dark'));
      await userEvent.click(screen.getByText('Dark'));

      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    });
  });

  describe('error handling', () => {
    it('shows error banner and allows dismissal', async () => {
      mockInvoke.mockImplementation(async (cmd: string) => {
        if (cmd === 'check_docker_connection') return true;
        if (cmd === 'list_containers') throw new Error('Test error');
        return undefined;
      });
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('×'));
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('container view actions', () => {
    it('shows create container and import compose buttons in container view', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => screen.getByText('Containers'));
      await userEvent.click(screen.getByText('Containers'));

      await waitFor(() => {
        expect(screen.getByText('Create Container')).toBeInTheDocument();
        expect(screen.getByText('Import Compose')).toBeInTheDocument();
      });
    });

    it('shows "Show all containers" checkbox', async () => {
      setupConnectedApp();
      render(<App />);

      await waitFor(() => screen.getByText('Containers'));
      await userEvent.click(screen.getByText('Containers'));

      await waitFor(() => {
        expect(screen.getByText('Show all containers')).toBeInTheDocument();
      });
    });
  });
});
