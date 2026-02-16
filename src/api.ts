import { invoke } from '@tauri-apps/api/core';
import type { ContainerInfo, ContainerDetails, ImageInfo, ContainerStats, VolumeInfo, NetworkDetails, CreateContainerRequest, ComposeDeployResult, RegistrySearchResult } from './types';

export const dockerApi = {
  async checkConnection(): Promise<boolean> {
    return invoke<boolean>('check_docker_connection');
  },

  async listContainers(all: boolean = false): Promise<ContainerInfo[]> {
    return invoke<ContainerInfo[]>('list_containers', { all });
  },

  async startContainer(id: string): Promise<void> {
    return invoke('start_container', { id });
  },

  async stopContainer(id: string): Promise<void> {
    return invoke('stop_container', { id });
  },

  async restartContainer(id: string): Promise<void> {
    return invoke('restart_container', { id });
  },

  async pauseContainer(id: string): Promise<void> {
    return invoke('pause_container', { id });
  },

  async unpauseContainer(id: string): Promise<void> {
    return invoke('unpause_container', { id });
  },

  async removeContainer(id: string, force: boolean = false): Promise<void> {
    return invoke('remove_container', { id, force });
  },

  async getContainerLogs(id: string, tail?: string): Promise<string> {
    return invoke<string>('get_container_logs', { id, tail });
  },

  async getContainerDetails(id: string): Promise<ContainerDetails> {
    return invoke<ContainerDetails>('get_container_details', { id });
  },

  async getContainerStats(id: string): Promise<ContainerStats> {
    return invoke<ContainerStats>('get_container_stats', { id });
  },

  async listImages(): Promise<ImageInfo[]> {
    return invoke<ImageInfo[]>('list_images');
  },

  async removeImage(id: string, force: boolean = false): Promise<void> {
    return invoke('remove_image', { id, force });
  },

  async pullImage(name: string): Promise<void> {
    return invoke('pull_image', { name });
  },

  // Volume management
  async listVolumes(): Promise<VolumeInfo[]> {
    return invoke<VolumeInfo[]>('list_volumes');
  },

  async createVolume(name: string): Promise<string> {
    return invoke<string>('create_volume', { name });
  },

  async removeVolume(name: string, force: boolean = false): Promise<void> {
    return invoke('remove_volume', { name, force });
  },

  // Network management
  async listNetworks(): Promise<NetworkDetails[]> {
    return invoke<NetworkDetails[]>('list_networks');
  },

  async createNetwork(name: string, driver: string = 'bridge'): Promise<string> {
    return invoke<string>('create_network', { name, driver });
  },

  async removeNetwork(id: string): Promise<void> {
    return invoke('remove_network', { id });
  },

  // Container creation
  async createContainer(request: CreateContainerRequest): Promise<string> {
    return invoke<string>('create_container', { request });
  },

  // Docker Compose
  async deployCompose(yamlContent: string): Promise<ComposeDeployResult[]> {
    return invoke<ComposeDeployResult[]>('deploy_compose', { yamlContent });
  },

  // Image existence check
  async checkImageExists(imageName: string): Promise<boolean> {
    return invoke<boolean>('check_image_exists', { imageName });
  },

  // Docker registry search
  async searchDockerHub(query: string, limit?: number): Promise<RegistrySearchResult[]> {
    return invoke<RegistrySearchResult[]>('search_docker_hub', { query, limit });
  },
};
