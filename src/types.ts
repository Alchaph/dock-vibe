export interface PortMapping {
  ip: string;
  private_port: number;
  public_port?: number;
  port_type: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: PortMapping[];
  created: number;
}

export interface MountInfo {
  mount_type: string;
  source: string;
  destination: string;
  mode: string;
  rw: boolean;
}

export interface NetworkInfo {
  networks: Record<string, string>;
}

export interface ContainerDetails {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: string;
  ports: PortMapping[];
  mounts: MountInfo[];
  env: string[];
  network_settings: NetworkInfo;
}

export interface ImageInfo {
  id: string;
  repo_tags: string[];
  size: number;
  created: number;
}

export interface ContainerStats {
  cpu_usage: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
  network_rx: number;
  network_tx: number;
}

export interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  created_at: string;
}

export interface NetworkDetails {
  id: string;
  name: string;
  driver: string;
  scope: string;
}

export interface CreateContainerRequest {
  image: string;
  name?: string;
  ports?: Record<string, string>; // "8080/tcp": "8080"
  volumes?: string[]; // ["vol1:/data", "/host/path:/container/path:ro"]
  env?: string[]; // ["KEY=value"]
  network?: string;
  restart_policy?: string; // "always", "unless-stopped", etc.
  command?: string[];
  memory_limit?: number; // Memory limit in bytes
  cpu_quota?: number;    // CPU quota (100000 = 1 CPU core)
}

export interface ComposeDeployResult {
  service_name: string;
  container_id?: string;
  success: boolean;
  error?: string;
}

export interface RegistrySearchResult {
  name: string;
  description: string;
  star_count: number;
  is_official: boolean;
  is_automated: boolean;
}
