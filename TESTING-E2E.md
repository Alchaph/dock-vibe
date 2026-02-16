# End-to-End Tests

This directory contains comprehensive end-to-end tests for the Dock application.

## Test Coverage

### Integration Tests (Rust Backend)

Located in `src-tauri/tests/integration_test.rs`

Tests cover:
1. **Docker Connection** - Verifies Docker daemon connectivity
2. **Image Pull and Container Creation** - Tests pulling nginx:alpine and creating a container
3. **Template Container with Ports and Environment** - Tests creating a Redis container with port mappings and environment variables
4. **Image Existence Check** - Verifies the image existence checking functionality
5. **Complete Template Workflow** - Tests creating and starting a Postgres container from template with:
   - Port bindings (host port 15432 → container port 5432)
   - Volume mounts (named volume for data persistence)
   - Environment variables (POSTGRES_PASSWORD, POSTGRES_USER, POSTGRES_DB)
   - Auto-start after creation

## Prerequisites

- Docker must be running locally
- Docker daemon must be accessible via the default socket
- Available ports: 15432 (for Postgres test), 6379 (for Redis test)

## Running Tests

### Run All Integration Tests

```bash
cd src-tauri
cargo test --test integration_test -- --ignored --nocapture --test-threads=1
```

### Run Specific Test

```bash
# Test Docker connection
cargo test --test integration_test -- --ignored --nocapture test_docker_connection

# Test nginx container creation
cargo test --test integration_test -- --ignored --nocapture test_pull_and_create_nginx_container

# Test Redis template (ports + env)
cargo test --test integration_test -- --ignored --nocapture test_template_container_with_ports_and_env

# Test Postgres template (complete workflow)
cargo test --test integration_test -- --ignored --nocapture test_create_and_start_postgres_template

# Test image existence check
cargo test --test integration_test -- --ignored --nocapture test_check_image_exists
```

## Test Notes

- Tests use the `#[ignore]` attribute to prevent running during normal `cargo test` runs
- Tests must be run with `--ignored` flag explicitly
- Use `--test-threads=1` to run tests sequentially and avoid port conflicts
- Tests automatically cleanup created containers and volumes
- Test containers use the prefix `test-` in their names for easy identification

## What Was Fixed

The tests revealed a critical bug: **containers created from templates were not starting automatically**. 

### The Bug

When users created a container from a template, the container was created but remained in a stopped state. This was confusing because:
- Users expected templates to create ready-to-use containers
- The container appeared in the list but wasn't running
- Users had to manually click "Start" after creation

### The Fix

1. **New Backend Command**: Added `create_and_start_container` Tauri command that creates AND starts the container in one operation
2. **Updated Frontend**: Modified `CreateContainer.tsx` to use the new command when creating from a template
3. **Backward Compatibility**: Regular container creation (not from template) still just creates without starting, giving users control

### Files Modified

- `src-tauri/src/main.rs` - Added `create_and_start_container` command
- `src/api.ts` - Added `createAndStartContainer` API method
- `src/components/CreateContainer.tsx` - Uses new API when `template` prop is provided
- `src-tauri/tests/integration_test.rs` - Comprehensive E2E tests

## CI/CD Integration

These tests can be integrated into GitHub Actions by adding a test step before the build:

```yaml
- name: Run Integration Tests
  run: |
    cd src-tauri
    cargo test --test integration_test -- --ignored --test-threads=1
```

Note: This requires Docker to be available in the CI environment.
