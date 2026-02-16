// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bollard::Docker;
use bollard::container::{ListContainersOptions, RemoveContainerOptions, LogsOptions, StartContainerOptions, StatsOptions, CreateContainerOptions, Config};
use bollard::image::{ListImagesOptions, RemoveImageOptions};
use bollard::network::{CreateNetworkOptions};
use bollard::volume::{CreateVolumeOptions, RemoveVolumeOptions};
use bollard::models::{ContainerSummary, HostConfig, PortBinding, Mount, MountTypeEnum, EndpointSettings};
use serde::{Deserialize, Serialize};
use serde_yaml;
use reqwest;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ContainerInfo {
    id: String,
    name: String,
    image: String,
    state: String,
    status: String,
    ports: Vec<PortMapping>,
    created: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PortMapping {
    ip: String,
    private_port: u16,
    public_port: Option<u16>,
    port_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ContainerDetails {
    id: String,
    name: String,
    image: String,
    state: String,
    status: String,
    created: String,
    ports: Vec<PortMapping>,
    mounts: Vec<MountInfo>,
    env: Vec<String>,
    network_settings: NetworkInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MountInfo {
    mount_type: String,
    source: String,
    destination: String,
    mode: String,
    rw: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NetworkInfo {
    networks: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ImageInfo {
    id: String,
    repo_tags: Vec<String>,
    size: i64,
    created: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ContainerStats {
    cpu_usage: f64,
    memory_usage: u64,
    memory_limit: u64,
    memory_percent: f64,
    network_rx: u64,
    network_tx: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct VolumeInfo {
    name: String,
    driver: String,
    mountpoint: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NetworkDetails {
    id: String,
    name: String,
    driver: String,
    scope: String,
    internal: bool,
    ipam: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CreateContainerRequest {
    name: Option<String>,
    image: String,
    env: Option<Vec<String>>,
    ports: Option<HashMap<String, String>>,  // "80/tcp" -> "8080"
    volumes: Option<Vec<String>>,  // "/host/path:/container/path" or "volume_name:/container/path"
    network: Option<String>,
    restart_policy: Option<String>,
    command: Option<Vec<String>>,
    memory_limit: Option<i64>,  // Memory limit in bytes
    cpu_quota: Option<i64>,     // CPU quota (100000 = 1 CPU core)
}

struct DockerState {
    docker: Arc<Mutex<Docker>>,
}

fn convert_container_summary(container: ContainerSummary) -> ContainerInfo {
    let ports = container.ports.unwrap_or_default()
        .iter()
        .map(|p| PortMapping {
            ip: p.ip.clone().unwrap_or_default(),
            private_port: p.private_port,
            public_port: p.public_port,
            port_type: p.typ.as_ref().map(|t| t.to_string()).unwrap_or_default(),
        })
        .collect();

    ContainerInfo {
        id: container.id.unwrap_or_default(),
        name: container.names.unwrap_or_default().first().unwrap_or(&String::new()).trim_start_matches('/').to_string(),
        image: container.image.unwrap_or_default(),
        state: container.state.unwrap_or_default(),
        status: container.status.unwrap_or_default(),
        ports,
        created: container.created.unwrap_or(0),
    }
}

#[tauri::command]
async fn list_containers(state: State<'_, DockerState>, all: bool) -> Result<Vec<ContainerInfo>, String> {
    let docker = state.docker.lock().await;
    
    let options = if all {
        Some(ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        })
    } else {
        None
    };

    let containers = docker.list_containers(options)
        .await
        .map_err(|e| format!("Failed to list containers: {}", e))?;

    Ok(containers.into_iter().map(convert_container_summary).collect())
}

#[tauri::command]
async fn start_container(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.start_container(&id, None::<StartContainerOptions<String>>)
        .await
        .map_err(|e| format!("Failed to start container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn stop_container(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.stop_container(&id, None)
        .await
        .map_err(|e| format!("Failed to stop container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn restart_container(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.restart_container(&id, None)
        .await
        .map_err(|e| format!("Failed to restart container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn pause_container(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.pause_container(&id)
        .await
        .map_err(|e| format!("Failed to pause container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn unpause_container(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.unpause_container(&id)
        .await
        .map_err(|e| format!("Failed to unpause container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn remove_container(state: State<'_, DockerState>, id: String, force: bool) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    let options = Some(RemoveContainerOptions {
        force,
        ..Default::default()
    });

    docker.remove_container(&id, options)
        .await
        .map_err(|e| format!("Failed to remove container: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn get_container_logs(state: State<'_, DockerState>, id: String, tail: Option<String>) -> Result<String, String> {
    let docker = state.docker.lock().await;
    
    let options = Some(LogsOptions::<String> {
        stdout: true,
        stderr: true,
        tail: tail.unwrap_or_else(|| "100".to_string()),
        ..Default::default()
    });

    use futures_util::stream::StreamExt;
    
    let mut logs_stream = docker.logs(&id, options);
    let mut logs = String::new();
    
    while let Some(log_result) = logs_stream.next().await {
        match log_result {
            Ok(log) => {
                logs.push_str(&log.to_string());
            },
            Err(e) => return Err(format!("Failed to read logs: {}", e)),
        }
    }
    
    Ok(logs)
}

#[tauri::command]
async fn get_container_details(state: State<'_, DockerState>, id: String) -> Result<ContainerDetails, String> {
    let docker = state.docker.lock().await;
    
    let container = docker.inspect_container(&id, None)
        .await
        .map_err(|e| format!("Failed to inspect container: {}", e))?;

    let name = container.name.unwrap_or_default().trim_start_matches('/').to_string();
    let config = container.config.unwrap_or_default();
    let state_info = container.state.unwrap_or_default();
    let network_settings = container.network_settings.unwrap_or_default();
    
    let ports = container.host_config
        .and_then(|hc| hc.port_bindings)
        .unwrap_or_default()
        .into_iter()
        .flat_map(|(port, bindings)| {
            bindings.unwrap_or_default().into_iter().map(move |binding| {
                let port_parts: Vec<&str> = port.split('/').collect();
                PortMapping {
                    ip: binding.host_ip.unwrap_or_default(),
                    private_port: port_parts[0].parse().unwrap_or(0),
                    public_port: binding.host_port.and_then(|p| p.parse().ok()),
                    port_type: port_parts.get(1).unwrap_or(&"tcp").to_string(),
                }
            })
        })
        .collect();

    let mounts = container.mounts.unwrap_or_default()
        .into_iter()
        .map(|m| MountInfo {
            mount_type: m.typ.map(|t| t.to_string()).unwrap_or_default(),
            source: m.source.unwrap_or_default(),
            destination: m.destination.unwrap_or_default(),
            mode: m.mode.unwrap_or_default(),
            rw: m.rw.unwrap_or(false),
        })
        .collect();

    let networks = network_settings.networks.unwrap_or_default()
        .into_iter()
        .map(|(name, network)| {
            let ip = network.ip_address.unwrap_or_default();
            (name, ip)
        })
        .collect();

    Ok(ContainerDetails {
        id: container.id.unwrap_or_default(),
        name,
        image: config.image.unwrap_or_default(),
        state: state_info.status.map(|s| s.to_string()).unwrap_or_default(),
        status: format!("{:?}", state_info),
        created: container.created.unwrap_or_default(),
        ports,
        mounts,
        env: config.env.unwrap_or_default(),
        network_settings: NetworkInfo { networks },
    })
}

#[tauri::command]
async fn check_docker_connection(state: State<'_, DockerState>) -> Result<bool, String> {
    let docker = state.docker.lock().await;
    
    match docker.ping().await {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Docker connection failed: {}", e)),
    }
}

// Image Management
#[tauri::command]
async fn list_images(state: State<'_, DockerState>) -> Result<Vec<ImageInfo>, String> {
    let docker = state.docker.lock().await;
    
    let options = Some(ListImagesOptions::<String> {
        all: true,
        ..Default::default()
    });
    
    let images = docker.list_images(options)
        .await
        .map_err(|e| format!("Failed to list images: {}", e))?;
    
    Ok(images.into_iter().map(|img| ImageInfo {
        id: img.id,
        repo_tags: img.repo_tags,
        size: img.size,
        created: img.created,
    }).collect())
}

#[tauri::command]
async fn remove_image(state: State<'_, DockerState>, id: String, force: bool) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    let options = Some(RemoveImageOptions {
        force,
        ..Default::default()
    });
    
    docker.remove_image(&id, options, None)
        .await
        .map_err(|e| format!("Failed to remove image: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn pull_image(state: State<'_, DockerState>, name: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    use futures_util::stream::StreamExt;
    
    let mut stream = docker.create_image(
        Some(bollard::image::CreateImageOptions {
            from_image: name,
            ..Default::default()
        }),
        None,
        None,
    );
    
    while let Some(result) = stream.next().await {
        result.map_err(|e| format!("Failed to pull image: {}", e))?;
    }
    
    Ok(())
}

// Resource Monitoring
#[tauri::command]
async fn get_container_stats(state: State<'_, DockerState>, id: String) -> Result<ContainerStats, String> {
    let docker = state.docker.lock().await;
    
    use futures_util::stream::StreamExt;
    
    let options = Some(StatsOptions {
        stream: false,
        one_shot: true,
    });
    
    let mut stats_stream = docker.stats(&id, options);
    
    if let Some(stats_result) = stats_stream.next().await {
        let stats = stats_result.map_err(|e| format!("Failed to get stats: {}", e))?;
        
        // Calculate CPU usage percentage
        let cpu_delta = stats.cpu_stats.cpu_usage.total_usage as f64 
            - stats.precpu_stats.cpu_usage.total_usage as f64;
        let system_delta = stats.cpu_stats.system_cpu_usage.unwrap_or(0) as f64 
            - stats.precpu_stats.system_cpu_usage.unwrap_or(0) as f64;
        let number_cpus = stats.cpu_stats.online_cpus.unwrap_or(1) as f64;
        
        let cpu_usage = if system_delta > 0.0 && cpu_delta > 0.0 {
            (cpu_delta / system_delta) * number_cpus * 100.0
        } else {
            0.0
        };
        
        // Memory stats
        let memory_usage = stats.memory_stats.usage.unwrap_or(0);
        let memory_limit = stats.memory_stats.limit.unwrap_or(1);
        let memory_percent = (memory_usage as f64 / memory_limit as f64) * 100.0;
        
        // Network stats
        let mut network_rx = 0u64;
        let mut network_tx = 0u64;
        
        if let Some(networks) = stats.networks {
            for (_, network) in networks {
                network_rx += network.rx_bytes;
                network_tx += network.tx_bytes;
            }
        }
        
        Ok(ContainerStats {
            cpu_usage,
            memory_usage,
            memory_limit,
            memory_percent,
            network_rx,
            network_tx,
        })
    } else {
        Err("Failed to retrieve stats".to_string())
    }
}

// Volume Management
#[tauri::command]
async fn list_volumes(state: State<'_, DockerState>) -> Result<Vec<VolumeInfo>, String> {
    let docker = state.docker.lock().await;
    
    let volumes = docker.list_volumes::<String>(None)
        .await
        .map_err(|e| format!("Failed to list volumes: {}", e))?;
    
    Ok(volumes.volumes.unwrap_or_default().into_iter().map(|v| VolumeInfo {
        name: v.name,
        driver: v.driver,
        mountpoint: v.mountpoint,
        created_at: v.created_at.unwrap_or_default(),
    }).collect())
}

#[tauri::command]
async fn create_volume(state: State<'_, DockerState>, name: String) -> Result<String, String> {
    let docker = state.docker.lock().await;
    
    let config = CreateVolumeOptions {
        name: name.clone(),
        ..Default::default()
    };
    
    let volume = docker.create_volume(config)
        .await
        .map_err(|e| format!("Failed to create volume: {}", e))?;
    
    Ok(volume.name)
}

#[tauri::command]
async fn remove_volume(state: State<'_, DockerState>, name: String, force: bool) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    let options = if force {
        Some(RemoveVolumeOptions { force: true })
    } else {
        None
    };
    
    docker.remove_volume(&name, options)
        .await
        .map_err(|e| format!("Failed to remove volume: {}", e))?;
    
    Ok(())
}

// Network Management
#[tauri::command]
async fn list_networks(state: State<'_, DockerState>) -> Result<Vec<NetworkDetails>, String> {
    let docker = state.docker.lock().await;
    
    let networks = docker.list_networks::<String>(None)
        .await
        .map_err(|e| format!("Failed to list networks: {}", e))?;
    
    Ok(networks.into_iter().map(|n| {
        let ipam = n.ipam.map(|ipam| {
            let mut map = HashMap::new();
            if let Some(config) = ipam.config {
                if let Some(first) = config.first() {
                    if let Some(subnet) = &first.subnet {
                        map.insert("subnet".to_string(), subnet.clone());
                    }
                    if let Some(gateway) = &first.gateway {
                        map.insert("gateway".to_string(), gateway.clone());
                    }
                }
            }
            map
        }).unwrap_or_default();
        
        NetworkDetails {
            id: n.id.unwrap_or_default(),
            name: n.name.unwrap_or_default(),
            driver: n.driver.unwrap_or_default(),
            scope: n.scope.unwrap_or_default(),
            internal: n.internal.unwrap_or(false),
            ipam,
        }
    }).collect())
}

#[tauri::command]
async fn create_network(state: State<'_, DockerState>, name: String, driver: Option<String>) -> Result<String, String> {
    let docker = state.docker.lock().await;
    
    let config = CreateNetworkOptions {
        name: name.clone(),
        driver: driver.unwrap_or_else(|| "bridge".to_string()),
        ..Default::default()
    };
    
    let response = docker.create_network(config)
        .await
        .map_err(|e| format!("Failed to create network: {}", e))?;
    
    Ok(response.id.unwrap_or(name))
}

#[tauri::command]
async fn remove_network(state: State<'_, DockerState>, id: String) -> Result<(), String> {
    let docker = state.docker.lock().await;
    
    docker.remove_network(&id)
        .await
        .map_err(|e| format!("Failed to remove network: {}", e))?;
    
    Ok(())
}

// Container Creation
#[tauri::command]
async fn create_container(state: State<'_, DockerState>, request: CreateContainerRequest) -> Result<String, String> {
    let docker = state.docker.lock().await;
    
    // Parse port bindings
    let mut port_bindings = HashMap::new();
    let mut exposed_ports = HashMap::new();
    
    if let Some(ports) = &request.ports {
        for (container_port, host_port) in ports {
            exposed_ports.insert(container_port.clone(), HashMap::new());
            port_bindings.insert(
                container_port.clone(),
                Some(vec![PortBinding {
                    host_ip: Some("0.0.0.0".to_string()),
                    host_port: Some(host_port.clone()),
                }]),
            );
        }
    }
    
    // Parse volume bindings
    let mut binds = Vec::new();
    let mut mounts = Vec::new();
    
    if let Some(volumes) = &request.volumes {
        for volume_spec in volumes {
            let parts: Vec<&str> = volume_spec.split(':').collect();
            if parts.len() >= 2 {
                let source = parts[0];
                let target = parts[1];
                let mode = if parts.len() > 2 { parts[2] } else { "rw" };
                
                // Check if source is a named volume or host path
                if source.starts_with('/') || source.starts_with('.') {
                    // Host path binding
                    binds.push(format!("{}:{}:{}", source, target, mode));
                } else {
                    // Named volume
                    mounts.push(Mount {
                        target: Some(target.to_string()),
                        source: Some(source.to_string()),
                        typ: Some(MountTypeEnum::VOLUME),
                        read_only: Some(mode == "ro"),
                        ..Default::default()
                    });
                }
            }
        }
    }
    
    // Build host config
    let mut host_config = HostConfig {
        port_bindings: if port_bindings.is_empty() { None } else { Some(port_bindings) },
        binds: if binds.is_empty() { None } else { Some(binds) },
        mounts: if mounts.is_empty() { None } else { Some(mounts) },
        memory: request.memory_limit,
        cpu_quota: request.cpu_quota,
        ..Default::default()
    };
    
    // Set restart policy
    if let Some(_policy) = &request.restart_policy {
        host_config.restart_policy = Some(bollard::models::RestartPolicy {
            name: Some(bollard::models::RestartPolicyNameEnum::UNLESS_STOPPED),
            ..Default::default()
        });
    }
    
    // Build network config
    let mut endpoints_config = HashMap::new();
    if let Some(network) = &request.network {
        endpoints_config.insert(
            network.clone(),
            EndpointSettings {
                ..Default::default()
            },
        );
    }
    
    // Build container config
    let config = Config {
        image: Some(request.image.clone()),
        env: request.env.clone(),
        exposed_ports: if exposed_ports.is_empty() { None } else { Some(exposed_ports) },
        host_config: Some(host_config),
        cmd: request.command.clone(),
        ..Default::default()
    };
    
    let options = request.name.as_ref().map(|name| CreateContainerOptions {
        name: name.as_str(),
        ..Default::default()
    });
    
    let container = docker.create_container(options, config)
        .await
        .map_err(|e| format!("Failed to create container: {}", e))?;
    
    Ok(container.id)
}

#[tauri::command]
async fn create_and_start_container(state: State<'_, DockerState>, request: CreateContainerRequest) -> Result<String, String> {
    // First, create the container
    let container_id = create_container(state.clone(), request).await?;
    
    // Then, start it immediately
    let docker = state.docker.lock().await;
    docker.start_container::<String>(&container_id, None)
        .await
        .map_err(|e| format!("Failed to start container after creation: {}", e))?;
    
    Ok(container_id)
}

// Docker Compose structures
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ComposeService {
    image: Option<String>,
    container_name: Option<String>,
    environment: Option<Vec<String>>,
    ports: Option<Vec<String>>,
    volumes: Option<Vec<String>>,
    networks: Option<Vec<String>>,
    restart: Option<String>,
    command: Option<serde_yaml::Value>,
    mem_limit: Option<String>,
    cpus: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ComposeFile {
    version: Option<String>,
    services: HashMap<String, ComposeService>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ComposeDeployResult {
    service_name: String,
    container_id: Option<String>,
    success: bool,
    error: Option<String>,
}

// Parse memory limit string (e.g., "512m", "1g") to bytes
fn parse_memory_limit(limit_str: &str) -> Option<i64> {
    let limit_str = limit_str.trim().to_lowercase();
    
    if let Some(stripped) = limit_str.strip_suffix('g') {
        stripped.parse::<i64>().ok().map(|v| v * 1024 * 1024 * 1024)
    } else if let Some(stripped) = limit_str.strip_suffix('m') {
        stripped.parse::<i64>().ok().map(|v| v * 1024 * 1024)
    } else if let Some(stripped) = limit_str.strip_suffix('k') {
        stripped.parse::<i64>().ok().map(|v| v * 1024)
    } else {
        limit_str.parse::<i64>().ok()
    }
}

#[tauri::command]
async fn deploy_compose(state: State<'_, DockerState>, yaml_content: String) -> Result<Vec<ComposeDeployResult>, String> {
    let compose: ComposeFile = serde_yaml::from_str(&yaml_content)
        .map_err(|e| format!("Failed to parse compose file: {}", e))?;
    
    let mut results = Vec::new();
    
    for (service_name, service) in compose.services {
        let result = deploy_service(&state, &service_name, &service).await;
        results.push(result);
    }
    
    Ok(results)
}

async fn deploy_service(
    state: &State<'_, DockerState>,
    service_name: &str,
    service: &ComposeService,
) -> ComposeDeployResult {
    let image = match &service.image {
        Some(img) => img.clone(),
        None => {
            return ComposeDeployResult {
                service_name: service_name.to_string(),
                container_id: None,
                success: false,
                error: Some("No image specified".to_string()),
            };
        }
    };
    
    // Parse ports from compose format ("8080:80") to HashMap
    let mut ports_map = HashMap::new();
    if let Some(ports) = &service.ports {
        for port_spec in ports {
            let parts: Vec<&str> = port_spec.split(':').collect();
            if parts.len() == 2 {
                let host_port = parts[0];
                let container_port = parts[1];
                let key = if container_port.contains('/') {
                    container_port.to_string()
                } else {
                    format!("{}/tcp", container_port)
                };
                ports_map.insert(key, host_port.to_string());
            }
        }
    }
    
    // Parse command
    let command = service.command.as_ref().and_then(|cmd| {
        match cmd {
            serde_yaml::Value::String(s) => Some(vec![s.clone()]),
            serde_yaml::Value::Sequence(seq) => {
                Some(seq.iter().filter_map(|v| {
                    if let serde_yaml::Value::String(s) = v {
                        Some(s.clone())
                    } else {
                        None
                    }
                }).collect())
            },
            _ => None,
        }
    });
    
    // Parse resource limits
    let memory_limit = service.mem_limit.as_ref().and_then(|m| parse_memory_limit(m));
    let cpu_quota = service.cpus.map(|cpus| (cpus * 100000.0) as i64);
    
    // Get first network if specified
    let network = service.networks.as_ref()
        .and_then(|nets| nets.first())
        .map(|n| n.clone());
    
    let request = CreateContainerRequest {
        name: service.container_name.clone().or(Some(service_name.to_string())),
        image: image.clone(),
        env: service.environment.clone(),
        ports: if ports_map.is_empty() { None } else { Some(ports_map) },
        volumes: service.volumes.clone(),
        network,
        restart_policy: service.restart.clone(),
        command,
        memory_limit,
        cpu_quota,
    };
    
    match create_container(state.clone(), request).await {
        Ok(container_id) => ComposeDeployResult {
            service_name: service_name.to_string(),
            container_id: Some(container_id),
            success: true,
            error: None,
        },
        Err(e) => ComposeDeployResult {
            service_name: service_name.to_string(),
            container_id: None,
            success: false,
            error: Some(e),
        },
    }
}

#[tauri::command]
async fn check_image_exists(state: State<'_, DockerState>, image_name: String) -> Result<bool, String> {
    let docker = state.docker.lock().await;
    
    let options = Some(ListImagesOptions::<String> {
        all: true,
        ..Default::default()
    });
    
    let images = docker.list_images(options)
        .await
        .map_err(|e| format!("Failed to list images: {}", e))?;
    
    // Check if any image matches the provided name
    let exists = images.iter().any(|img| {
        img.repo_tags.iter().any(|tag| tag == &image_name)
    });
    
    Ok(exists)
}

// Registry search structures
#[derive(Debug, Clone, Serialize, Deserialize)]
struct RegistrySearchResult {
    name: String,
    description: String,
    star_count: i64,
    is_official: bool,
    is_automated: bool,
}

// Docker Hub search response structures
#[derive(Debug, Deserialize)]
struct DockerHubSearchResponse {
    results: Vec<DockerHubResult>,
}

#[derive(Debug, Deserialize)]
struct DockerHubResult {
    name: String,
    description: Option<String>,
    star_count: i64,
    is_official: bool,
    is_automated: bool,
}

#[tauri::command]
async fn search_docker_hub(query: String, limit: Option<usize>) -> Result<Vec<RegistrySearchResult>, String> {
    let limit = limit.unwrap_or(25);
    let url = format!(
        "https://hub.docker.com/api/content/v1/products/search?q={}&page_size={}",
        urlencoding::encode(&query),
        limit
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Search-Version", "v3")
        .send()
        .await
        .map_err(|e| format!("Failed to search Docker Hub: {}", e))?;
    
    if !response.status().is_success() {
        // Try legacy API endpoint
        let legacy_url = format!(
            "https://hub.docker.com/v2/search/repositories/?query={}&page_size={}",
            urlencoding::encode(&query),
            limit
        );
        
        let legacy_response = client
            .get(&legacy_url)
            .send()
            .await
            .map_err(|e| format!("Failed to search Docker Hub (legacy): {}", e))?;
        
        let search_response: DockerHubSearchResponse = legacy_response
            .json()
            .await
            .map_err(|e| format!("Failed to parse search results: {}", e))?;
        
        let results = search_response
            .results
            .into_iter()
            .map(|r| RegistrySearchResult {
                name: r.name,
                description: r.description.unwrap_or_else(|| "No description".to_string()),
                star_count: r.star_count,
                is_official: r.is_official,
                is_automated: r.is_automated,
            })
            .collect();
        
        return Ok(results);
    }
    
    // Parse the new API response
    #[derive(Debug, Deserialize)]
    struct NewSearchResponse {
        summaries: Vec<NewSearchResult>,
    }
    
    #[derive(Debug, Deserialize)]
    struct NewSearchResult {
        name: String,
        #[serde(default)]
        slug: String,
        #[serde(default)]
        short_description: String,
        #[serde(default)]
        star_count: i64,
        #[serde(default)]
        filter_type: String,
    }
    
    let new_response: NewSearchResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;
    
    let results = new_response
        .summaries
        .into_iter()
        .map(|r| RegistrySearchResult {
            name: if !r.slug.is_empty() { r.slug } else { r.name },
            description: r.short_description,
            star_count: r.star_count,
            is_official: r.filter_type == "official",
            is_automated: false,
        })
        .collect();
    
    Ok(results)
}

fn main() {
    // Initialize Docker connection
    let docker = Docker::connect_with_local_defaults()
        .expect("Failed to connect to Docker daemon");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DockerState {
            docker: Arc::new(Mutex::new(docker)),
        })
        .invoke_handler(tauri::generate_handler![
            list_containers,
            start_container,
            stop_container,
            restart_container,
            pause_container,
            unpause_container,
            remove_container,
            get_container_logs,
            get_container_details,
            check_docker_connection,
            list_images,
            remove_image,
            pull_image,
            get_container_stats,
            list_volumes,
            create_volume,
            remove_volume,
            list_networks,
            create_network,
            remove_network,
            create_container,
            create_and_start_container,
            deploy_compose,
            check_image_exists,
            search_docker_hub,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
