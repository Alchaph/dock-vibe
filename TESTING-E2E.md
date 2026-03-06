# End-to-End Tests

## Integration Tests (Rust Backend)

Located in `src-tauri/tests/integration_test.rs`

### Test Coverage

1. **Docker Connection** - Verifies Docker daemon connectivity
2. **Image Pull & Container Creation** - Pull nginx:alpine, create container
3. **Template Container with Ports & Env** - Redis container with port mappings and environment variables
4. **Image Existence Check** - Verify image existence checking
5. **Complete Template Workflow** - Postgres container from template with ports, volumes, env vars, auto-start

### Prerequisites

- Docker running locally
- Available ports: 15432 (Postgres test), 6379 (Redis test)

### Running Tests

```bash
# All integration tests
cd src-tauri
cargo test --test integration_test -- --ignored --nocapture --test-threads=1

# Specific test
cargo test --test integration_test -- --ignored --nocapture test_docker_connection
```

Tests use `#[ignore]` to prevent running during normal `cargo test`. Use `--test-threads=1` to avoid port conflicts. Test containers use `test-` prefix and are auto-cleaned.
