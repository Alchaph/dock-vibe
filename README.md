# Dock - Docker GUI Manager

Modern cross-platform desktop application for managing Docker containers with an intuitive Windows 8 Metro-styled interface.

![Docker GUI](https://img.shields.io/badge/Docker-GUI-2496ED?logo=docker)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## Features

- **Container Management** - Create, start, stop, restart, pause, remove containers
- **Container Terminal** - Interactive shell access (exec) via xterm.js
- **Real-time Dashboard** - CPU, memory, and network I/O statistics for all running containers
- **Image Management** - List, pull, remove images + Docker Hub registry search
- **Volume & Network Management** - Full CRUD operations
- **Docker Compose Support** - Upload and deploy compose files
- **76 Templates** - Pre-configured templates across 16 categories
- **Enhanced Logs** - Search, filter, copy, export container logs
- **System Prune** - Clean up unused containers, images, volumes, and networks
- **Dark/Light Mode** - Metro-styled interface with theme toggle
- **Auto-pull Images** - Automatically pull missing images when using templates

## Quick Start

### Prerequisites
- Docker (running locally)
- Node.js 18+
- Rust 1.70+

### Installation

```bash
npm install
npm run tauri:dev
```

First run compiles Rust dependencies (~2-3 min). Subsequent runs are fast.

### Build

```bash
npm run tauri:build
```

Outputs to `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb` and `.AppImage`
- **Windows**: `.msi` and `.exe`

### Troubleshooting

**"Docker connection failed"** - Ensure Docker is running. On Linux, add your user to the docker group: `sudo usermod -aG docker $USER` then re-login.

**Build errors on Linux** - Install system dependencies:
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript 5.9, Vite
- **Backend**: Tauri 2.0, Rust, Bollard (Docker API client)
- **Design**: Windows 8 Metro flat design

### Navigation (6 Tabs)
Templates | Containers | Images | Volumes | Networks | Dashboard

Keyboard shortcuts: `1`-`5` for quick tab switching.

### Backend Commands (33 Tauri commands)

| Category | Commands |
|----------|----------|
| **Containers** | `list_containers`, `start_container`, `stop_container`, `restart_container`, `pause_container`, `unpause_container`, `remove_container`, `get_container_logs`, `get_container_details`, `create_container`, `create_and_start_container` |
| **Images** | `list_images`, `remove_image`, `pull_image` (streaming via Channel), `check_image_exists` |
| **Stats** | `get_container_stats`, `get_all_container_stats` |
| **Volumes** | `list_volumes`, `create_volume`, `remove_volume` |
| **Networks** | `list_networks`, `create_network`, `remove_network` |
| **Compose** | `deploy_compose` |
| **Registry** | `search_docker_hub` |
| **System** | `check_docker_connection`, `system_prune` |
| **Terminal** | `start_terminal`, `write_terminal`, `resize_terminal`, `close_terminal` |

### Frontend Components (20+)

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main app, routing, state, dark mode, 6-tab navigation |
| `ContainerList.tsx` | Container table with search, stats cards, bulk actions |
| `ContainerDetailsView.tsx` | Detail view with resource monitoring |
| `LogsView.tsx` | Enhanced logs with search, copy, export |
| `ImageList.tsx` | Image management with search |
| `PullImage.tsx` | Image pull modal with streaming progress |
| `VolumeList.tsx` | Volume management |
| `NetworkList.tsx` | Network management |
| `CreateContainer.tsx` | Container creation wizard with template support |
| `Templates.tsx` | 76 templates, 16 categories, custom template management |
| `ComposeUpload.tsx` | Docker Compose file upload and deployment |
| `RegistrySearch.tsx` | Docker Hub search interface |
| `ResourceDashboard.tsx` | Real-time resource dashboard for all containers |
| `Terminal.tsx` | Interactive terminal/exec access (xterm.js) |
| `SystemPrune.tsx` | System cleanup tool |
| `Toast.tsx` | Toast notification system |
| `ConfirmModal.tsx` | Confirmation dialog for destructive actions |

### Input Validation

All user inputs validated server-side in `src-tauri/src/validation.rs`:
- Container/volume/network names, image names, ports, env var keys, volume paths

See [SECURITY.md](SECURITY.md) for full security details.

### Templates (76 across 16 categories)

Databases, Caching, Web Servers, Runtimes, Messaging, Monitoring, Dev Tools, CMS & Apps, Utilities, Media, Productivity, Files & Docs, Home & IoT, Self-Hosted Dev, Networking, Dashboards

Custom templates supported with localStorage persistence and JSON import/export.

## Testing

### Unit Tests (Frontend)
```bash
npm run test          # 225 tests across 16 test files
```

### Integration Tests (Rust Backend)
```bash
npm run test:e2e      # Requires Docker running locally
```

See [TESTING-E2E.md](TESTING-E2E.md) for integration test details.

## Release

Automated via GitHub Actions on push to `main`. See [RELEASE.md](RELEASE.md).

## License

MIT License
