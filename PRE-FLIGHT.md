# Pre-Flight Checklist

Before running Phase 1 tests, ensure all prerequisites are met.

## System Requirements

### Operating System
- [ ] macOS 10.15 or higher
- [ ] Linux (Ubuntu 20.04+, Fedora 35+, Debian 11+)  
- [ ] Windows 10/11

### Docker Installation

**Check Docker is installed:**
```bash
docker --version
# Should output: Docker version XX.XX.XX
```

**Check Docker is running:**
```bash
docker ps
# Should list containers or show empty table (not error)
```

**Linux Only - Check permissions:**
```bash
docker ps
# If permission denied, run:
# sudo usermod -aG docker $USER
# Then log out and log back in
```

### Development Tools

**Node.js (18+):**
```bash
node --version
# Should output: v18.x.x or higher
```

**npm:**
```bash
npm --version
# Should output: 9.x.x or higher
```

**Rust (1.70+):**
```bash
rustc --version
# Should output: rustc 1.70.x or higher

# If not installed:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Platform-Specific Dependencies

**macOS:**
```bash
xcode-select --install
# May show "already installed" - that's OK
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
- [ ] Microsoft Visual Studio C++ Build Tools installed
- [ ] WebView2 Runtime (usually pre-installed)

## Project Setup

### Dependencies Installed

```bash
cd docker-gui
npm install
# Should complete without errors
```

### Frontend Builds Successfully

```bash
npm run build
# Should output: built in XXXms
```

### Frontend Lints Successfully

```bash
npm run lint
# Should complete with no errors
```

## Test Environment Setup

### Test Containers Created

```bash
./test-setup.sh
# Creates test-nginx, test-alpine, test-postgres, test-redis
```

**Verify containers:**
```bash
docker ps -a --filter "name=test-"
# Should show 4 test containers
```

## Ready to Test

Once all checkboxes above are complete, you're ready to run the application:

```bash
npm run tauri:dev
```

**First run notes:**
- First compilation takes 5-10 minutes (Rust dependencies)
- Subsequent runs take < 30 seconds
- A window should open showing the Docker GUI application

## Quick Verification

### Application Launches
- [ ] Application window opens
- [ ] "Docker GUI" header is visible
- [ ] No "Docker Connection Failed" error

### Basic Functionality
- [ ] Can see list of containers
- [ ] Can click on a container name
- [ ] Container details appear
- [ ] Can click "Back to List"
- [ ] Can click "Logs" on running container

### Basic Operations
- [ ] Can toggle "Show all containers"
- [ ] Container list updates
- [ ] Can click "Refresh"
- [ ] Can stop a running container
- [ ] Can start a stopped container

## If Tests Fail

### Application Won't Start
1. Check Rust is installed: `rustc --version`
2. Check all dependencies installed
3. Try: `cd src-tauri && cargo clean`
4. Try again: `npm run tauri:dev`

### Docker Connection Failed
1. Verify Docker is running: `docker ps`
2. Linux: Check permissions (see above)
3. Check Docker socket exists:
   - Linux: `/var/run/docker.sock`
   - macOS: `~/Library/Containers/com.docker.docker/Data/docker.sock`
   - Windows: `//./pipe/docker_engine`

### Build Errors
1. Update Node dependencies: `npm install`
2. Update Rust: `rustup update`
3. Clean build: `npm run build` and check for errors
4. Check platform dependencies installed (see above)

### Tests Pass Checklist

After running all tests in TESTING.md:

- [ ] All critical tests (T1-T8) pass
- [ ] Error handling works (T10)
- [ ] UI/UX is acceptable (T11)
- [ ] No blocking bugs found
- [ ] Performance is acceptable
- [ ] Application is ready for user testing

## Cleanup

When testing is complete:

```bash
./test-cleanup.sh
# Removes all test containers
```

---

**Status**: Pre-flight checks incomplete | Ready to proceed: NO

Once all checkboxes are checked, update status to: **Ready to proceed: YES**
