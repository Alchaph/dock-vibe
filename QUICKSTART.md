# Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Install Prerequisites

**Install Rust:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Install Node.js:**
- Download from https://nodejs.org/ (v18 or higher)

**Make sure Docker is running:**
- macOS/Windows: Start Docker Desktop
- Linux: `sudo systemctl start docker`

### Step 2: Install Dependencies

```bash
cd docker-gui
npm install
```

This will install all frontend dependencies.

### Step 3: Run the Application

```bash
npm run tauri:dev
```

The first run will take a few minutes as Rust dependencies are compiled. Subsequent runs will be much faster.

### Step 4: Use the Application

1. **View Containers**: The main screen shows all running containers
2. **Show All**: Toggle "Show all containers" to see stopped containers
3. **Control Containers**: Click Start/Stop/Restart buttons
4. **View Details**: Click on a container name
5. **View Logs**: Click the "Logs" button for running containers

## Common Commands

### Development
```bash
# Run in development mode with hot-reload
npm run tauri:dev

# Build frontend only
npm run build

# Lint code
npm run lint
```

### Production
```bash
# Build for production
npm run tauri:build

# Output will be in:
# src-tauri/target/release/bundle/
```

## Troubleshooting

### "Docker connection failed"
- Make sure Docker is running
- On Linux: Add your user to docker group
  ```bash
  sudo usermod -aG docker $USER
  # Then log out and log back in
  ```

### "Command not found: cargo"
- Make sure Rust is installed and in PATH
  ```bash
  source $HOME/.cargo/env
  ```

### Build errors on Linux
- Install required dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
  
  # Fedora
  sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel
  ```

## Features Overview

### Container Management
- ✅ Start/Stop/Restart containers
- ✅ Pause/Unpause containers
- ✅ Remove containers
- ✅ View container details
- ✅ View container logs

### User Interface
- ✅ Auto-refresh every 5 seconds
- ✅ Filter running/all containers
- ✅ Color-coded status indicators
- ✅ Dark theme

## Next Steps

- Check out the full [README.md](README.md) for detailed documentation
- See [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details
- Review [requirements.md](../requirements.md) for planned features

## Getting Help

If you encounter issues:
1. Check the Troubleshooting section above
2. Review error messages in the application
3. Check Docker logs: `docker logs <container-id>`
4. Verify Docker is accessible: `docker ps`

Happy container management!
