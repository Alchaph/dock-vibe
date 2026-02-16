# Dock - Docker GUI Manager

A modern, cross-platform desktop application for managing Docker containers with an intuitive graphical interface. Built with Tauri, React, and TypeScript featuring a Windows 8 Metro flat design.

![Docker GUI](https://img.shields.io/badge/Docker-GUI-2496ED?logo=docker)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## Features

### Container Management ✅
- **Create Containers** - Full-featured wizard with image selection, port mappings, volume mounts, environment variables, network selection, and restart policies
- **List & Filter** - View all or running containers with auto-refresh
- **Lifecycle Control** - Start, stop, restart, pause, unpause containers with one click
- **Remove Containers** - Delete containers with confirmation dialog
- **Real-time Status** - Auto-updating container states with color-coded indicators
  
### Container Details & Monitoring ✅
- **Comprehensive Information** - View ports, volumes, environment variables, networks
- **Resource Monitoring** - Real-time CPU usage, memory usage, and network I/O statistics
- **Enhanced Logs** - View logs with search, highlight, scroll controls, copy to clipboard, and configurable tail length
  
### Image Management ✅
- **Browse Images** - List all local Docker images with tags, sizes, and creation dates
- **Pull Images** - Download images from Docker Hub with progress feedback
- **Remove Images** - Delete unused images with confirmation

### Volume Management ✅
- **List Volumes** - View all Docker volumes with driver and mountpoint information
- **Create Volumes** - Create new volumes for persistent data storage
- **Remove Volumes** - Delete volumes with safety confirmations

### Network Management ✅
- **List Networks** - View all Docker networks with driver and scope details
- **Create Networks** - Create custom networks with driver selection (bridge, host, overlay, macvlan, none)
- **Remove Networks** - Delete custom networks (system networks protected)

### User Interface ✅
- **Windows 8 Metro Design** - Clean, flat, modern interface with bold colors
- **Dark & Light Modes** - Toggle between themes with persistent preferences
- **Responsive Layout** - Works seamlessly on different screen sizes
- **4-Tab Navigation** - Containers, Images, Volumes, Networks
- **Color-Coded Status** - Green (running), Gray (stopped), Orange (paused)

### Upcoming Features (Phase 3)
- Docker Compose support (start/stop stacks, view service relationships)
- Application templates and presets (PostgreSQL, MySQL, Redis, etc.)
- Remote Docker host support
- Advanced settings and preferences
- Resource limit configuration

## Prerequisites

### Development Requirements
1. **Rust** (1.70+)
   - Install from: https://www.rust-lang.org/tools/install
   - Required for Tauri backend

2. **Node.js** (18+)
   - Install from: https://nodejs.org/

3. **Docker**
   - Docker Desktop (macOS/Windows): https://www.docker.com/products/docker-desktop
   - Docker Engine (Linux): https://docs.docker.com/engine/install/

4. **Platform-specific dependencies**
   
   **macOS:**
   ```bash
   xcode-select --install
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

   **Linux (Fedora):**
   ```bash
   sudo dnf install webkit2gtk4.1-devel \
     openssl-devel \
     curl \
     wget \
     file \
     libappindicator-gtk3-devel \
     librsvg2-devel
   ```

   **Windows:**
   - Install Microsoft Visual Studio C++ Build Tools
   - WebView2 (usually pre-installed on Windows 10/11)

## Installation

### Clone the Repository
```bash
cd docker-gui
```

### Install Dependencies
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run tauri:dev
```

This will:
1. Start the Vite development server
2. Launch the Tauri application
3. Enable hot-reload for React components

### Build for Production
```bash
npm run tauri:build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.AppImage`
- **Windows**: `.msi` and `.exe`

## Usage

### First Launch
1. Make sure Docker is running on your system
2. Launch Dock
3. The application will automatically connect to your local Docker daemon

### Creating Containers
1. Click the **"Containers"** tab
2. Click **"Create Container"** button
3. Fill in the wizard:
   - Select an image from your local images
   - (Optional) Give the container a name
   - Add port mappings (e.g., host port 8080 → container port 80/tcp)
   - Add volume mounts (named volumes or bind mounts)
   - Add environment variables as key-value pairs
   - Select network (default: bridge)
   - Choose restart policy (default: no)
   - (Optional) Override the default command
4. Click **"Create Container"** to launch

### Managing Containers

**List Containers:**
- By default, only running containers are shown
- Toggle "Show all containers" to include stopped containers
- Auto-refreshes every 5 seconds

**Start/Stop/Restart:**
- Click the action buttons in the Actions column
- Status updates immediately with color changes

**View Container Details:**
- Click on a container name to view:
  - General information (ID, image, state, created date)
  - Real-time resource statistics (CPU, memory, network)
  - Port mappings
  - Volume mounts
  - Environment variables
  - Network settings

**View Logs:**
- Click the "Logs" button for any container
- Use the search box to find specific log entries
- Select tail length from dropdown (50/100/500/1000/All)
- Scroll to top/bottom with dedicated buttons
- Copy all logs to clipboard
- Open logs as raw text in browser
- Click "Refresh" to reload logs

**Remove Containers:**
- Click "Remove" button (only available for stopped containers)
- Confirm the action in the dialog

### Managing Images

**Browse Images:**
- Click the **"Images"** tab to see all local images
- View repository tags, image IDs, sizes, and creation dates

**Pull New Images:**
- Click **"Pull Image"** button
- Enter image name (e.g., `nginx:alpine`, `postgres:15`)
- Wait for download to complete

**Remove Images:**
- Click **"Remove"** button next to any image
- Confirm deletion

### Managing Volumes

**List Volumes:**
- Click the **"Volumes"** tab to see all Docker volumes
- View volume name, driver, mountpoint, and creation date

**Create Volume:**
- Click **"Create Volume"** button
- Enter a volume name
- Click **"Create"**

**Remove Volume:**
- Click **"Remove"** button next to any volume
- Confirm deletion (warning: permanently deletes all data)

### Managing Networks

**List Networks:**
- Click the **"Networks"** tab to see all Docker networks
- View network name, ID, driver, and scope
- System networks (bridge, host, none) are protected

**Create Network:**
- Click **"Create Network"** button
- Enter a network name
- Select driver (bridge/host/overlay/macvlan/none)
- Click **"Create"**

**Remove Network:**
- Click **"Remove"** button next to custom networks
- System networks cannot be removed

### Theme Toggle
- Click the sun/moon icon in the header to toggle between dark and light modes
- Your preference is saved automatically

## Project Structure

```
docker-gui/
├── src/                      # React frontend
│   ├── components/          # React components (11 total)
│   │   ├── ContainerList.tsx
│   │   ├── ContainerDetailsView.tsx
│   │   ├── LogsView.tsx
│   │   ├── ImageList.tsx
│   │   ├── PullImage.tsx
│   │   ├── VolumeList.tsx
│   │   ├── NetworkList.tsx
│   │   ├── CreateContainer.tsx
│   │   └── [CSS files for each]
│   ├── api.ts              # Docker API wrapper (21 commands)
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # React entry point
├── src-tauri/              # Tauri backend
│   ├── src/
│   │   ├── main.rs         # Rust with Docker integration (21 commands)
│   │   └── lib.rs          # Tauri library
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json
└── README.md
```

## Technology Stack

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **CSS**: Custom styling with CSS variables

### Backend
- **Tauri 2.0**: Desktop application framework
- **Rust**: Backend language
- **Bollard**: Docker Engine API client for Rust
- **Tokio**: Async runtime for Rust

## Architecture

The application uses a client-server architecture:

1. **Frontend (React)**: 
   - Renders the UI
   - Manages application state
   - Calls Tauri commands

2. **Backend (Rust)**:
   - Communicates with Docker daemon via Unix socket/named pipe
   - Exposes Tauri commands for frontend
   - Handles async operations with Tokio

3. **Docker Integration**:
   - Uses Bollard library for Docker API
   - Supports Docker Desktop and Docker Engine
   - Auto-detects local Docker daemon

## Troubleshooting

### Docker Connection Failed
- Ensure Docker daemon is running
- On Linux, add your user to the docker group: `sudo usermod -aG docker $USER`
- On macOS/Windows, make sure Docker Desktop is running

### Build Errors
- Make sure all prerequisites are installed
- Try cleaning and rebuilding: `cargo clean` in `src-tauri/` directory
- Update dependencies: `npm install` and `cargo update`

### Permission Denied (Linux)
- Add user to docker group: `sudo usermod -aG docker $USER`
- Log out and log back in
- Or run with: `sudo docker-gui` (not recommended)

## Development

### Adding New Features
1. Define TypeScript types in `src/types.ts`
2. Add Rust command in `src-tauri/src/main.rs`
3. Create API wrapper in `src/api.ts`
4. Build UI component in `src/components/`
5. Integrate into `src/App.tsx`

### Testing
```bash
# Frontend linting
npm run lint

# Build check
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Roadmap

- [x] Phase 1: MVP (Container listing, start/stop, logs) - ✅ COMPLETE
- [x] Phase 2: Container creation wizard - ✅ COMPLETE
- [x] Phase 2: Resource monitoring - ✅ COMPLETE
- [x] Phase 2: Image management - ✅ COMPLETE
- [x] Phase 3: Volume management - ✅ COMPLETE
- [x] Phase 3: Network management - ✅ COMPLETE
- [ ] Phase 2: Docker Compose support - IN PROGRESS
- [ ] Phase 3: Templates and presets - PLANNED
- [ ] Phase 3: Remote Docker support - PLANNED

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Docker integration via [Bollard](https://github.com/fussybeaver/bollard)
- UI built with [React](https://react.dev/)
