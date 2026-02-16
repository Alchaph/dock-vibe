use regex::Regex;

/// Validates container/volume names (alphanumeric, hyphens, underscores, dots)
pub fn validate_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    
    if name.len() > 255 {
        return Err("Name too long (max 255 characters)".to_string());
    }
    
    let valid_pattern = Regex::new(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]*$").unwrap();
    if !valid_pattern.is_match(name) {
        return Err("Name must start with alphanumeric and contain only alphanumeric, hyphens, underscores, or dots".to_string());
    }
    
    Ok(())
}

/// Validates Docker image name format
pub fn validate_image_name(image: &str) -> Result<(), String> {
    if image.is_empty() {
        return Err("Image name cannot be empty".to_string());
    }
    
    if image.len() > 255 {
        return Err("Image name too long".to_string());
    }
    
    // Basic validation - image can have registry, repository, and tag
    // e.g., registry.io/repo/image:tag or just nginx:latest
    let parts: Vec<&str> = image.split(':').collect();
    if parts.len() > 2 {
        return Err("Invalid image format (multiple colons)".to_string());
    }
    
    Ok(())
}

/// Validates port number (1-65535)
pub fn validate_port(port: u16) -> Result<(), String> {
    if port == 0 {
        return Err("Port number cannot be 0".to_string());
    }
    Ok(())
}

/// Validates port string format
pub fn validate_port_string(port_str: &str) -> Result<u16, String> {
    port_str
        .parse::<u16>()
        .map_err(|_| format!("Invalid port number: {}", port_str))
        .and_then(|p| {
            validate_port(p)?;
            Ok(p)
        })
}

/// Validates environment variable key (must start with letter, alphanumeric + underscore)
pub fn validate_env_key(key: &str) -> Result<(), String> {
    if key.is_empty() {
        return Err("Environment variable name cannot be empty".to_string());
    }
    
    let valid_pattern = Regex::new(r"^[a-zA-Z_][a-zA-Z0-9_]*$").unwrap();
    if !valid_pattern.is_match(key) {
        return Err(format!("Invalid environment variable name: {} (must start with letter/underscore, contain only alphanumeric/underscore)", key));
    }
    
    Ok(())
}

/// Validates volume mount path (must be absolute path)
pub fn validate_volume_path(path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("Volume path cannot be empty".to_string());
    }
    
    // Check for directory traversal attempts
    if path.contains("..") {
        return Err("Volume path cannot contain '..' (directory traversal)".to_string());
    }
    
    // On Unix, must start with /
    // On Windows, must start with drive letter (C:, D:, etc.) or UNC path (\\)
    #[cfg(unix)]
    if !path.starts_with('/') {
        return Err("Volume path must be absolute (start with /)".to_string());
    }
    
    #[cfg(windows)]
    {
        let is_drive_path = path.len() >= 2 && path.chars().nth(1) == Some(':');
        let is_unc_path = path.starts_with("\\\\") || path.starts_with("//");
        
        if !is_drive_path && !is_unc_path && !path.starts_with('/') {
            return Err("Volume path must be absolute (drive letter or UNC path)".to_string());
        }
    }
    
    Ok(())
}

/// Validates memory limit string (e.g., "512m", "1g")
#[allow(dead_code)]
pub fn validate_memory_limit(limit: &str) -> Result<(), String> {
    let limit_lower = limit.trim().to_lowercase();
    
    if limit_lower.is_empty() {
        return Ok(()); // Empty is allowed (no limit)
    }
    
    let valid_suffixes = ["k", "m", "g", "kb", "mb", "gb"];
    let has_valid_suffix = valid_suffixes.iter().any(|s| limit_lower.ends_with(s));
    
    if !has_valid_suffix && limit_lower.parse::<u64>().is_err() {
        return Err("Memory limit must be a number or include suffix (k, m, g)".to_string());
    }
    
    Ok(())
}

/// Validates CPU limit (must be positive number)
#[allow(dead_code)]
pub fn validate_cpu_limit(cpus: f64) -> Result<(), String> {
    if cpus <= 0.0 {
        return Err("CPU limit must be positive".to_string());
    }
    
    if cpus > 1024.0 {
        return Err("CPU limit unreasonably high (max 1024 cores)".to_string());
    }
    
    Ok(())
}

/// Validates network name
pub fn validate_network_name(network: &str) -> Result<(), String> {
    if network.is_empty() {
        return Err("Network name cannot be empty".to_string());
    }
    
    // Docker allows: bridge, host, none, container:<name>, or custom network name
    let builtin_networks = ["bridge", "host", "none"];
    if builtin_networks.contains(&network) {
        return Ok(());
    }
    
    if network.starts_with("container:") {
        return Ok(());
    }
    
    // Custom network name validation
    validate_name(network)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_name() {
        assert!(validate_name("my-container").is_ok());
        assert!(validate_name("container_1").is_ok());
        assert!(validate_name("").is_err());
        assert!(validate_name("-invalid").is_err());
        assert!(validate_name("with space").is_err());
    }

    #[test]
    fn test_validate_port() {
        assert!(validate_port(80).is_ok());
        assert!(validate_port(65535).is_ok());
        assert!(validate_port(0).is_err());
    }

    #[test]
    fn test_validate_env_key() {
        assert!(validate_env_key("PATH").is_ok());
        assert!(validate_env_key("MY_VAR").is_ok());
        assert!(validate_env_key("_PRIVATE").is_ok());
        assert!(validate_env_key("123").is_err());
        assert!(validate_env_key("").is_err());
    }

    #[test]
    fn test_validate_volume_path() {
        assert!(validate_volume_path("/data").is_ok());
        assert!(validate_volume_path("/var/lib/data").is_ok());
        assert!(validate_volume_path("../etc").is_err());
        assert!(validate_volume_path("relative/path").is_err());
    }
}
