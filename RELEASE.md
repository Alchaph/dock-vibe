# Release Guide

## Creating a Release

The project uses GitHub Actions for automated builds. To create a new release:

1. **Update version numbers** (if not already done):
   - `package.json` - Update the `version` field
   - `src-tauri/Cargo.toml` - Update the `version` field
   - `src-tauri/tauri.conf.json` - Update the `version` field

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.0"
   ```

3. **Create and push a tag**:
   ```bash
   git tag v1.0.0
   git push origin main
   git push origin v1.0.0
   ```

4. **GitHub Actions will automatically**:
   - Build the application for macOS, Linux, and Windows
   - Create installers (.dmg, .app, .deb, .AppImage, .msi, .exe)
   - Create a GitHub release with all binaries attached

5. **Check the release**:
   - Go to your repository on GitHub
   - Navigate to "Releases"
   - The new release should be available with all platform binaries

## Manual Build

If you need to build manually:

```bash
npm install
npm run tauri:build
```

Build artifacts will be in `src-tauri/target/release/bundle/`

## Version Format

Use semantic versioning: `v<major>.<minor>.<patch>`
- Example: `v1.0.0`, `v1.1.0`, `v2.0.0`
