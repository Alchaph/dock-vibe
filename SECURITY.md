# Security

## Security Measures

### 1. Input Validation (`src-tauri/src/validation.rs`)

All user inputs are validated server-side before processing:

- **Container/Volume names**: Alphanumeric + hyphens/underscores/dots, max 255 chars
- **Image names**: Non-empty, max 255 chars, valid Docker format
- **Ports**: Must be 1-65535
- **Environment variable keys**: Must start with letter/underscore, alphanumeric + underscores only
- **Volume paths**: Must be absolute, directory traversal (`..`) blocked
- **Network names**: Built-in networks allowed, custom names validated

### 2. Content Security Policy (CSP)

Strict CSP in `tauri.conf.json` restricts resource loading to same-origin, with exceptions only for Docker Hub API calls and HTTPS images.

### 3. No Shell Command Execution

All Docker operations use the Bollard library (Rust Docker client). Zero `std::process::Command` calls with user input — eliminates command injection.

### 4. Type-Safe API

All Tauri command parameters are strongly typed in Rust with compile-time type checking.

### 5. Memory Safety

Rust guarantees: no buffer overflows, no use-after-free, no null pointer dereferences. Thread-safe async with Tokio.

### 6. Docker Daemon Access

Local Docker daemon only. Uses Docker socket permissions. No remote connections or credential storage.

### 7. File System Access

Only YAML uploads for Docker Compose, parsed in-memory. Volume paths validated before mounting.

## Data Privacy

- No telemetry or analytics
- No external data transmission (except Docker Hub search)
- All data stays local
- No user tracking

## Security Best Practices for Users

- Only grant Docker access to trusted users
- Review volume mounts and port exposures before creating containers
- Use specific image version tags (not `latest`)
- Use read-only mounts when possible (`:ro` suffix)

## Reporting Security Issues

- **GitHub Issues**: https://github.com/Alchaph/dock-vibe/issues (non-critical)
- **Private Disclosure**: Contact repository owner directly for critical vulnerabilities
