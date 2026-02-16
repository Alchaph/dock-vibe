use std::collections::HashMap;

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require Docker to be running locally
    
    #[tokio::test]
    #[ignore] // Run with: cargo test -- --ignored --test-threads=1
    async fn test_docker_connection() {
        let docker = bollard::Docker::connect_with_socket_defaults()
            .expect("Failed to connect to Docker");
        
        let version = docker.version().await;
        assert!(version.is_ok(), "Docker should be accessible");
    }

    #[tokio::test]
    #[ignore] // Run with: cargo test -- --ignored --test-threads=1
    async fn test_pull_and_create_nginx_container() {
        use bollard::Docker;
        use bollard::image::CreateImageOptions;
        use bollard::container::{Config, CreateContainerOptions, RemoveContainerOptions};
        use futures_util::stream::StreamExt;
        
        let docker = Docker::connect_with_socket_defaults()
            .expect("Failed to connect to Docker");
        
        // Cleanup any existing test container
        let _ = docker.remove_container("test-nginx-e2e", Some(RemoveContainerOptions {
            force: true,
            ..Default::default()
        })).await;
        
        // Pull nginx:alpine image
        let create_image_options = CreateImageOptions {
            from_image: "nginx",
            tag: "alpine",
            ..Default::default()
        };
        
        let mut stream = docker.create_image(Some(create_image_options), None, None);
        while let Some(result) = stream.next().await {
            assert!(result.is_ok(), "Image pull should succeed");
        }
        
        // Create container from image
        let config = Config {
            image: Some("nginx:alpine".to_string()),
            ..Default::default()
        };
        
        let options = CreateContainerOptions {
            name: "test-nginx-e2e",
            ..Default::default()
        };
        
        let container = docker.create_container(Some(options), config).await;
        assert!(container.is_ok(), "Container creation should succeed");
        
        let container_id = container.unwrap().id;
        
        // Start the container
        let start_result = docker.start_container::<String>(&container_id, None).await;
        assert!(start_result.is_ok(), "Container should start successfully");
        
        // Wait a moment for container to fully start
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        // Inspect container to verify it's running
        let inspect = docker.inspect_container(&container_id, None).await;
        assert!(inspect.is_ok(), "Should be able to inspect container");
        
        let container_info = inspect.unwrap();
        let state = container_info.state.unwrap();
        assert!(state.running.unwrap_or(false), "Container should be running");
        
        // Cleanup: stop and remove container
        let _ = docker.stop_container(&container_id, None).await;
        let _ = docker.remove_container(&container_id, None).await;
    }

    #[tokio::test]
    #[ignore]
    async fn test_template_container_with_ports_and_env() {
        use bollard::Docker;
        use bollard::container::{Config, CreateContainerOptions, RemoveContainerOptions};
        use bollard::service::{HostConfig, PortBinding};
        use std::collections::HashMap;
        
        let docker = Docker::connect_with_socket_defaults()
            .expect("Failed to connect to Docker");
        
        // Cleanup any existing test container
        let _ = docker.remove_container("test-redis-template-e2e", Some(RemoveContainerOptions {
            force: true,
            ..Default::default()
        })).await;
        
        // Simulate creating a container from a template (like Redis)
        let mut port_bindings = HashMap::new();
        let mut exposed_ports = HashMap::new();
        
        exposed_ports.insert("6379/tcp".to_string(), HashMap::new());
        port_bindings.insert(
            "6379/tcp".to_string(),
            Some(vec![PortBinding {
                host_ip: Some("0.0.0.0".to_string()),
                host_port: Some("6379".to_string()),
            }]),
        );
        
        let host_config = HostConfig {
            port_bindings: Some(port_bindings),
            ..Default::default()
        };
        
        let config = Config {
            image: Some("redis:alpine".to_string()),
            exposed_ports: Some(exposed_ports),
            host_config: Some(host_config),
            env: Some(vec!["REDIS_PASSWORD=testpass".to_string()]),
            ..Default::default()
        };
        
        let options = CreateContainerOptions {
            name: "test-redis-template-e2e",
            ..Default::default()
        };
        
        // First, ensure the image exists (pull if needed)
        use bollard::image::CreateImageOptions;
        use futures_util::stream::StreamExt;
        
        let create_image_options = CreateImageOptions {
            from_image: "redis",
            tag: "alpine",
            ..Default::default()
        };
        
        let mut stream = docker.create_image(Some(create_image_options), None, None);
        while let Some(_) = stream.next().await {}
        
        // Create container
        let container = docker.create_container(Some(options), config).await;
        assert!(container.is_ok(), "Container creation should succeed");
        
        let container_id = container.unwrap().id;
        
        // Start the container (this is what was missing!)
        let start_result = docker.start_container::<String>(&container_id, None).await;
        assert!(start_result.is_ok(), "Container should start successfully");
        
        // Wait for container to start
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        // Verify container is running
        let inspect = docker.inspect_container(&container_id, None).await;
        assert!(inspect.is_ok(), "Should be able to inspect container");
        
        let container_info = inspect.unwrap();
        let state = container_info.state.unwrap();
        assert!(state.running.unwrap_or(false), "Container should be running after start");
        
        // Verify port bindings
        let host_config_result = container_info.host_config.unwrap();
        let bindings = host_config_result.port_bindings.unwrap();
        assert!(bindings.contains_key("6379/tcp"), "Should have port binding for 6379");
        
        // Cleanup
        let _ = docker.stop_container(&container_id, None).await;
        let _ = docker.remove_container(&container_id, None).await;
    }

    #[tokio::test]
    #[ignore]
    async fn test_check_image_exists() {
        use bollard::Docker;
        use bollard::image::ListImagesOptions;
        use std::collections::HashMap;
        
        let docker = Docker::connect_with_socket_defaults()
            .expect("Failed to connect to Docker");
        
        // Check for a common image that probably exists
        let mut filters = HashMap::new();
        filters.insert("reference".to_string(), vec!["alpine:latest".to_string()]);
        
        let options = ListImagesOptions {
            filters,
            ..Default::default()
        };
        
        let images = docker.list_images(Some(options)).await;
        assert!(images.is_ok(), "Should be able to list images");
        
        // If alpine doesn't exist, the list will be empty
        // This tests the check_image_exists logic
        let image_list = images.unwrap();
        let exists = !image_list.is_empty();
        
        println!("alpine:latest exists: {}", exists);
        // This is just informational, not an assertion
    }

    #[tokio::test]
    #[ignore]
    async fn test_create_and_start_postgres_template() {
        use bollard::Docker;
        use bollard::image::CreateImageOptions;
        use bollard::container::{Config, CreateContainerOptions, RemoveContainerOptions};
        use bollard::service::{HostConfig, PortBinding, Mount, MountTypeEnum};
        use futures_util::stream::StreamExt;
        
        let docker = Docker::connect_with_socket_defaults()
            .expect("Failed to connect to Docker");
        
        // Cleanup any existing test container
        let _ = docker.remove_container("test-postgres-template-e2e", Some(RemoveContainerOptions {
            force: true,
            ..Default::default()
        })).await;
        
        // Pull postgres image
        let create_image_options = CreateImageOptions {
            from_image: "postgres",
            tag: "alpine",
            ..Default::default()
        };
        
        let mut stream = docker.create_image(Some(create_image_options), None, None);
        while let Some(_) = stream.next().await {}
        
        // Setup port bindings (use 15432 instead of 5432 to avoid conflicts)
        let mut port_bindings = HashMap::new();
        let mut exposed_ports = HashMap::new();
        
        exposed_ports.insert("5432/tcp".to_string(), HashMap::new());
        port_bindings.insert(
            "5432/tcp".to_string(),
            Some(vec![PortBinding {
                host_ip: Some("0.0.0.0".to_string()),
                host_port: Some("15432".to_string()),
            }]),
        );
        
        // Setup volume mount
        let mounts = vec![Mount {
            target: Some("/var/lib/postgresql/data".to_string()),
            source: Some("test-postgres-data".to_string()),
            typ: Some(MountTypeEnum::VOLUME),
            read_only: Some(false),
            ..Default::default()
        }];
        
        let host_config = HostConfig {
            port_bindings: Some(port_bindings),
            mounts: Some(mounts),
            ..Default::default()
        };
        
        let config = Config {
            image: Some("postgres:alpine".to_string()),
            exposed_ports: Some(exposed_ports),
            host_config: Some(host_config),
            env: Some(vec![
                "POSTGRES_PASSWORD=testpassword".to_string(),
                "POSTGRES_USER=testuser".to_string(),
                "POSTGRES_DB=testdb".to_string(),
            ]),
            ..Default::default()
        };
        
        let options = CreateContainerOptions {
            name: "test-postgres-template-e2e",
            ..Default::default()
        };
        
        // Create container
        let container = docker.create_container(Some(options), config).await;
        if let Err(e) = &container {
            eprintln!("Failed to create Postgres container: {}", e);
        }
        assert!(container.is_ok(), "Postgres container creation should succeed: {:?}", container);
        
        let container_id = container.unwrap().id;
        
        // THIS IS THE KEY: Start the container immediately after creation
        let start_result = docker.start_container::<String>(&container_id, None).await;
        if let Err(e) = &start_result {
            eprintln!("Failed to start Postgres container: {}", e);
            // Cleanup before asserting
            let _ = docker.remove_container(&container_id, None).await;
        }
        assert!(start_result.is_ok(), "Postgres container should start successfully: {:?}", start_result);
        
        // Wait for postgres to initialize
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        
        // Verify container is running
        let inspect = docker.inspect_container(&container_id, None).await.unwrap();
        let state = inspect.state.unwrap();
        assert!(state.running.unwrap_or(false), "Postgres container should be running");
        
        // Cleanup
        let _ = docker.stop_container(&container_id, None).await;
        let _ = docker.remove_container(&container_id, None).await;
        
        // Cleanup volume
        use bollard::volume::RemoveVolumeOptions;
        let _ = docker.remove_volume("test-postgres-data", None::<RemoveVolumeOptions>).await;
    }
}
