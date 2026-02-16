# Release Guide

## Automated Release on Push

The project uses GitHub Actions with the official Tauri action template for **automatic builds on every push to main**.

### How It Works

Every push to the `main` branch automatically:
1. ✅ Builds for **all platforms** (macOS Intel, macOS Apple Silicon, Linux, Windows)
2. ✅ Creates installers for each platform
3. ✅ Generates a **draft release** on GitHub
4. ✅ Uploads all build artifacts to the release

### Platforms Built

| Platform | Artifacts |
|----------|-----------|
| **macOS (Intel)** | `.dmg`, `.app.tar.gz` (x86_64) |
| **macOS (Apple Silicon)** | `.dmg`, `.app.tar.gz` (aarch64) |
| **Linux (Ubuntu)** | `.deb`, `.AppImage` |
| **Windows** | `.msi`, `.exe` |

## Creating a Release

### Method 1: Auto-Release on Push (Recommended)

1. **Update version numbers**:
   ```bash
   # Update these files:
   # - package.json
   # - src-tauri/Cargo.toml  
   # - src-tauri/tauri.conf.json
   ```

2. **Commit and push to main**:
   ```bash
   git add .
   git commit -m "chore: bump version to 1.1.0"
   git push origin main
   ```

3. **Wait for GitHub Actions** (typically 15-20 minutes):
   - Go to https://github.com/Alchaph/dock-vibe/actions
   - Watch the "Build and Release" workflow
   - All platforms build in parallel

4. **Publish the draft release**:
   - Go to https://github.com/Alchaph/dock-vibe/releases
   - Find the draft release
   - Edit if needed
   - Click "Publish release"

### Method 2: Tagged Release

For versioned releases, create a git tag:

```bash
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

This will:
- Trigger the same build process
- Use the tag name (e.g., `v1.1.0`) as the release name
- Create a draft release

### Method 3: Manual Trigger

You can also manually trigger a build:

1. Go to https://github.com/Alchaph/dock-vibe/actions
2. Click "Build and Release"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

## What's Included in Each Release

The automated workflow creates:

### macOS Binaries
- **Universal DMG**: Drag-and-drop installer (both Intel and Apple Silicon)
- **App Bundle (Intel)**: `.app.tar.gz` for x86_64
- **App Bundle (Apple Silicon)**: `.app.tar.gz` for aarch64

### Linux Binaries
- **Debian Package**: `.deb` for Ubuntu/Debian-based distros
- **AppImage**: Portable Linux executable (no installation needed)

### Windows Binaries
- **MSI Installer**: Windows installer package
- **EXE Setup**: Standalone executable installer

## Workflow Features

### Optimizations
- ✅ **Caching**: npm and Rust dependencies cached for faster builds
- ✅ **Parallel Builds**: All platforms build simultaneously
- ✅ **Draft Releases**: Review before publishing
- ✅ **Universal Binaries**: macOS builds for both architectures

### Triggers
The workflow runs on:
- **Push to main**: Automatic build every commit
- **Git tags**: `v*` tags (e.g., `v1.0.0`)
- **Manual**: Via GitHub Actions UI

## Manual Local Build

If you need to build locally:

```bash
# Install dependencies
npm install

# Build for current platform
npm run tauri:build

# Build artifacts will be in:
# src-tauri/target/release/bundle/
```

### Platform-Specific Notes

**macOS**:
```bash
# Build for current architecture
npm run tauri:build

# Build for specific target
npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon
npm run tauri build -- --target x86_64-apple-darwin   # Intel
```

**Linux**:
```bash
# Requires dependencies
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

npm run tauri:build
```

**Windows**:
```powershell
# Requires Visual Studio Build Tools
npm run tauri:build
```

## Version Format

Use semantic versioning: `v<major>.<minor>.<patch>`

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - New features
- `v1.1.1` - Bug fixes
- `v2.0.0` - Breaking changes

## Troubleshooting

### Build Fails on macOS
- Ensure Xcode Command Line Tools are installed
- Check that both targets are added: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`

### Build Fails on Linux
- Verify all required system libraries are installed
- Check Ubuntu version (workflow uses 22.04)

### Build Fails on Windows
- Ensure Visual Studio Build Tools are installed
- Check that Windows SDK is available

### Release Not Created
- Check GitHub Actions logs
- Verify `GITHUB_TOKEN` has write permissions
- Ensure workflow file syntax is correct

## Release Checklist

Before publishing a release:

- [ ] Version numbers updated in all 3 files
- [ ] IMPLEMENTATION.md updated with changes
- [ ] All tests passing (`npm run test:e2e`)
- [ ] Build successful on all platforms
- [ ] Release notes written
- [ ] Binaries tested on target platforms
- [ ] Draft release reviewed
- [ ] Release published

## Post-Release

After publishing:

1. Announce the release (Discord, Twitter, etc.)
2. Update documentation if needed
3. Monitor for issues/bug reports
4. Plan next release milestones
