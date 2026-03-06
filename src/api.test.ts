import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { dockerApi } from './api';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  Channel: class MockChannel {
    onmessage: ((msg: unknown) => void) | null = null;
  },
}));

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dockerApi', () => {
  describe('checkConnection', () => {
    it('calls check_docker_connection and returns boolean', async () => {
      mockInvoke.mockResolvedValue(true);
      const result = await dockerApi.checkConnection();
      expect(mockInvoke).toHaveBeenCalledWith('check_docker_connection');
      expect(result).toBe(true);
    });

    it('returns false when disconnected', async () => {
      mockInvoke.mockResolvedValue(false);
      const result = await dockerApi.checkConnection();
      expect(result).toBe(false);
    });
  });

  describe('listContainers', () => {
    it('passes all=false by default', async () => {
      mockInvoke.mockResolvedValue([]);
      await dockerApi.listContainers();
      expect(mockInvoke).toHaveBeenCalledWith('list_containers', { all: false });
    });

    it('passes all=true when requested', async () => {
      mockInvoke.mockResolvedValue([]);
      await dockerApi.listContainers(true);
      expect(mockInvoke).toHaveBeenCalledWith('list_containers', { all: true });
    });

    it('returns container list', async () => {
      const containers = [
        { id: 'abc123', name: 'test', image: 'nginx', state: 'running', status: 'Up', ports: [], created: 1000 },
      ];
      mockInvoke.mockResolvedValue(containers);
      const result = await dockerApi.listContainers();
      expect(result).toEqual(containers);
    });
  });

  describe('container actions', () => {
    it('startContainer calls start_container', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.startContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('start_container', { id: 'abc123' });
    });

    it('stopContainer calls stop_container', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.stopContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('stop_container', { id: 'abc123' });
    });

    it('restartContainer calls restart_container', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.restartContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('restart_container', { id: 'abc123' });
    });

    it('pauseContainer calls pause_container', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.pauseContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('pause_container', { id: 'abc123' });
    });

    it('unpauseContainer calls unpause_container', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.unpauseContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('unpause_container', { id: 'abc123' });
    });

    it('removeContainer passes force flag', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.removeContainer('abc123', true);
      expect(mockInvoke).toHaveBeenCalledWith('remove_container', { id: 'abc123', force: true });
    });

    it('removeContainer defaults force to false', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.removeContainer('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('remove_container', { id: 'abc123', force: false });
    });
  });

  describe('getContainerLogs', () => {
    it('passes id and tail parameter', async () => {
      mockInvoke.mockResolvedValue('log line 1\nlog line 2');
      const result = await dockerApi.getContainerLogs('abc123', '100');
      expect(mockInvoke).toHaveBeenCalledWith('get_container_logs', { id: 'abc123', tail: '100' });
      expect(result).toBe('log line 1\nlog line 2');
    });

    it('works without tail parameter', async () => {
      mockInvoke.mockResolvedValue('logs');
      await dockerApi.getContainerLogs('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('get_container_logs', { id: 'abc123', tail: undefined });
    });
  });

  describe('getContainerDetails', () => {
    it('returns container details', async () => {
      const details = {
        id: 'abc123',
        name: 'test',
        image: 'nginx',
        state: 'running',
        status: 'Up',
        created: '2024-01-01',
        ports: [],
        mounts: [],
        env: ['KEY=value'],
        network_settings: { networks: {} },
      };
      mockInvoke.mockResolvedValue(details);
      const result = await dockerApi.getContainerDetails('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('get_container_details', { id: 'abc123' });
      expect(result).toEqual(details);
    });
  });

  describe('getContainerStats', () => {
    it('returns container stats', async () => {
      const stats = {
        cpu_usage: 25.5,
        memory_usage: 1048576,
        memory_limit: 2097152,
        memory_percent: 50.0,
        network_rx: 1024,
        network_tx: 512,
      };
      mockInvoke.mockResolvedValue(stats);
      const result = await dockerApi.getContainerStats('abc123');
      expect(mockInvoke).toHaveBeenCalledWith('get_container_stats', { id: 'abc123' });
      expect(result).toEqual(stats);
    });
  });

  describe('image operations', () => {
    it('listImages calls list_images', async () => {
      const images = [{ id: 'sha256:abc', repo_tags: ['nginx:latest'], size: 1000, created: 1000 }];
      mockInvoke.mockResolvedValue(images);
      const result = await dockerApi.listImages();
      expect(mockInvoke).toHaveBeenCalledWith('list_images');
      expect(result).toEqual(images);
    });

    it('removeImage passes force flag', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.removeImage('sha256:abc', true);
      expect(mockInvoke).toHaveBeenCalledWith('remove_image', { id: 'sha256:abc', force: true });
    });

    it('pullImage calls pull_image', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.pullImage('nginx:latest');
      expect(mockInvoke).toHaveBeenCalledWith('pull_image', { name: 'nginx:latest', onProgress: expect.any(Object) });
    });

    it('checkImageExists calls check_image_exists', async () => {
      mockInvoke.mockResolvedValue(true);
      const result = await dockerApi.checkImageExists('nginx:latest');
      expect(mockInvoke).toHaveBeenCalledWith('check_image_exists', { imageName: 'nginx:latest' });
      expect(result).toBe(true);
    });
  });

  describe('volume operations', () => {
    it('listVolumes calls list_volumes', async () => {
      mockInvoke.mockResolvedValue([]);
      await dockerApi.listVolumes();
      expect(mockInvoke).toHaveBeenCalledWith('list_volumes');
    });

    it('createVolume passes name', async () => {
      mockInvoke.mockResolvedValue('vol-id');
      const result = await dockerApi.createVolume('my-volume');
      expect(mockInvoke).toHaveBeenCalledWith('create_volume', { name: 'my-volume' });
      expect(result).toBe('vol-id');
    });

    it('removeVolume passes name and force', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.removeVolume('my-volume', true);
      expect(mockInvoke).toHaveBeenCalledWith('remove_volume', { name: 'my-volume', force: true });
    });
  });

  describe('network operations', () => {
    it('listNetworks calls list_networks', async () => {
      mockInvoke.mockResolvedValue([]);
      await dockerApi.listNetworks();
      expect(mockInvoke).toHaveBeenCalledWith('list_networks');
    });

    it('createNetwork passes name and driver', async () => {
      mockInvoke.mockResolvedValue('net-id');
      const result = await dockerApi.createNetwork('my-network', 'bridge');
      expect(mockInvoke).toHaveBeenCalledWith('create_network', { name: 'my-network', driver: 'bridge' });
      expect(result).toBe('net-id');
    });

    it('createNetwork defaults driver to bridge', async () => {
      mockInvoke.mockResolvedValue('net-id');
      await dockerApi.createNetwork('my-network');
      expect(mockInvoke).toHaveBeenCalledWith('create_network', { name: 'my-network', driver: 'bridge' });
    });

    it('removeNetwork calls remove_network', async () => {
      mockInvoke.mockResolvedValue(undefined);
      await dockerApi.removeNetwork('net-id');
      expect(mockInvoke).toHaveBeenCalledWith('remove_network', { id: 'net-id' });
    });
  });

  describe('container creation', () => {
    it('createContainer passes request object', async () => {
      const request = {
        image: 'nginx:latest',
        name: 'my-nginx',
        ports: { '80/tcp': '8080' },
      };
      mockInvoke.mockResolvedValue('container-id');
      const result = await dockerApi.createContainer(request);
      expect(mockInvoke).toHaveBeenCalledWith('create_container', { request });
      expect(result).toBe('container-id');
    });

    it('createAndStartContainer passes request object', async () => {
      const request = { image: 'nginx:latest' };
      mockInvoke.mockResolvedValue('container-id');
      const result = await dockerApi.createAndStartContainer(request);
      expect(mockInvoke).toHaveBeenCalledWith('create_and_start_container', { request });
      expect(result).toBe('container-id');
    });
  });

  describe('compose deployment', () => {
    it('deployCompose passes yaml content', async () => {
      const results = [
        { service_name: 'web', container_id: 'abc', success: true },
        { service_name: 'db', container_id: 'def', success: true },
      ];
      mockInvoke.mockResolvedValue(results);
      const result = await dockerApi.deployCompose('version: "3"\nservices:\n  web:\n    image: nginx');
      expect(mockInvoke).toHaveBeenCalledWith('deploy_compose', { yamlContent: 'version: "3"\nservices:\n  web:\n    image: nginx' });
      expect(result).toEqual(results);
    });
  });

  describe('registry search', () => {
    it('searchDockerHub passes query and limit', async () => {
      const results = [
        { name: 'nginx', description: 'Web server', star_count: 1000, is_official: true, is_automated: false },
      ];
      mockInvoke.mockResolvedValue(results);
      const result = await dockerApi.searchDockerHub('nginx', 10);
      expect(mockInvoke).toHaveBeenCalledWith('search_docker_hub', { query: 'nginx', limit: 10 });
      expect(result).toEqual(results);
    });

    it('searchDockerHub works without limit', async () => {
      mockInvoke.mockResolvedValue([]);
      await dockerApi.searchDockerHub('redis');
      expect(mockInvoke).toHaveBeenCalledWith('search_docker_hub', { query: 'redis', limit: undefined });
    });
  });

  describe('error propagation', () => {
    it('propagates invoke errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Docker daemon not running'));
      await expect(dockerApi.checkConnection()).rejects.toThrow('Docker daemon not running');
    });
  });
});
