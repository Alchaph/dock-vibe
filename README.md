# Dock - Docker GUI Manager

Modern cross-platform desktop application for managing Docker containers with an intuitive Windows 8 Metro-styled interface.

![Docker GUI](https://img.shields.io/badge/Docker-GUI-2496ED?logo=docker)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## Features

- **Container Management** - Create, start, stop, restart, pause, remove containers
- **Real-time Monitoring** - CPU, memory, and network I/O statistics
- **Image Management** - List, pull, remove images + Docker Hub registry search
- **Volume & Network Management** - Full CRUD operations
- **Docker Compose Support** - Upload and deploy compose files
- **40+ Templates** - Pre-configured templates for popular applications
- **Enhanced Logs** - Search, filter, copy, export container logs
- **Dark/Light Mode** - Metro-styled interface with theme toggle
- **Auto-pull Images** - Automatically pull missing images when using templates

## Quick Start

### Prerequisites
- Docker (running locally)
- Node.js 18+
- Rust 1.70+

### Installation

```bash
cd docker-gui
npm install
npm run tauri:dev
```

### Build

```bash
npm run tauri:build
```

Outputs to `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb` and `.AppImage`
- **Windows**: `.msi` and `.exe`

## Usage

1. Ensure Docker is running
2. Launch Dock
3. Manage containers, images, volumes, and networks through the GUI
4. Use templates for quick deployment of popular applications
5. Import Docker Compose files for multi-container applications
6. Search Docker Hub registry for new images

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Tauri 2.0, Rust, Bollard (Docker API)
- **Design**: Windows 8 Metro flat design

## License

MIT License
