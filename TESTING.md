# Phase 1 Testing Guide

## Prerequisites for Testing

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Verify installation
```

### 2. Ensure Docker is Running
```bash
docker ps  # Should list running containers without error
```

### 3. Create Test Containers (if needed)
```bash
# Create a simple nginx container for testing
docker run -d --name test-nginx -p 8080:80 nginx:alpine

# Create a stopped container for testing
docker create --name test-alpine alpine:latest sleep 3600

# Verify containers exist
docker ps -a
```

## Running the Application

### Development Mode
```bash
cd docker-gui
npm install
npm run tauri:dev
```

**Note**: First run will take 5-10 minutes as Rust compiles Tauri and dependencies. Subsequent runs will be much faster (< 30 seconds).

## Test Cases

### Test 1: Docker Connection Check

**Objective**: Verify the application can connect to Docker daemon

**Steps**:
1. Ensure Docker is running
2. Launch the application
3. Application should show the main interface (not error screen)

**Expected Result**: 
- Application displays "Docker GUI" header
- Container list is visible
- No "Docker Connection Failed" error

**Failure Scenario**:
1. Stop Docker daemon
2. Launch the application
3. Should see "Docker Connection Failed" error
4. Click "Retry Connection" button
5. Start Docker daemon
6. Click "Retry Connection" again
7. Should connect successfully

---

### Test 2: Container Listing

**Objective**: Verify containers are listed correctly

**Test 2a: Running Containers Only**

**Steps**:
1. Ensure "Show all containers" is unchecked
2. Verify only running containers are displayed

**Expected Result**:
- Only containers with "running" status are shown
- Each container shows: status indicator, name, image, state, ports, created date
- Status indicator is green for running containers

**Test 2b: All Containers**

**Steps**:
1. Check "Show all containers" checkbox
2. Verify all containers (running and stopped) are displayed

**Expected Result**:
- Both running and stopped containers are shown
- Running containers have green status indicator
- Stopped containers have gray status indicator
- List auto-refreshes every 5 seconds

---

### Test 3: Start/Stop Operations

**Objective**: Verify start and stop operations work correctly

**Test 3a: Stop Running Container**

**Steps**:
1. Identify a running container (e.g., test-nginx)
2. Click the "Stop" button
3. Wait for operation to complete

**Expected Result**:
- Container status changes from "running" to "exited"
- Status indicator changes from green to gray
- "Stop" button disappears
- "Start" and "Remove" buttons appear

**Test 3b: Start Stopped Container**

**Steps**:
1. Identify a stopped container
2. Click the "Start" button
3. Wait for operation to complete

**Expected Result**:
- Container status changes from "exited" to "running"
- Status indicator changes from gray to green
- "Start" button disappears
- "Stop" and "Restart" buttons appear

**Error Handling**:
- If operation fails, error banner should appear at top
- Error message should be descriptive
- User can dismiss error with "×" button

---

### Test 4: Restart Operation

**Objective**: Verify restart operation works

**Steps**:
1. Identify a running container
2. Click the "Restart" button
3. Observe status changes

**Expected Result**:
- Container briefly shows as stopped/starting
- Container returns to "running" state
- Status indicator remains green
- Container logs should show restart

---

### Test 5: Pause/Unpause Operations

**Objective**: Verify pause and unpause operations work

**Test 5a: Pause Container**

**Steps**:
1. Find a running container
2. Use Docker CLI to pause it: `docker pause <container-id>`
3. Verify UI updates

**Expected Result**:
- Container status shows "paused"
- Status indicator is orange
- "Unpause" button is available

**Test 5b: Unpause Container**

**Steps**:
1. Click "Unpause" button on paused container
2. Wait for operation to complete

**Expected Result**:
- Container status returns to "running"
- Status indicator changes to green
- Regular action buttons (Stop, Restart) appear

**Note**: The UI doesn't currently have a "Pause" button in the action list, but the backend supports it. This can be tested via Docker CLI.

---

### Test 6: Remove Container

**Objective**: Verify container removal works with confirmation

**Steps**:
1. Stop a container if it's running
2. Click the "Remove" button
3. Confirm the deletion in the dialog

**Expected Result**:
- Confirmation dialog appears with message
- If confirmed: container disappears from list
- If cancelled: container remains in list

**Safety Check**:
- "Remove" button should only appear for stopped containers
- Running containers should not show "Remove" button

---

### Test 7: Container Details View

**Objective**: Verify detailed container information is displayed correctly

**Steps**:
1. Click on any container name in the list
2. Details view should open

**Expected Result**:
- **General Information section**:
  - Container ID (first 12 characters)
  - Full image name
  - Current state (with colored badge)
  - Created timestamp
  
- **Port Mappings section**:
  - Table with Container Port, Host Port, Type columns
  - Shows all port mappings
  - Shows "-" if no ports mapped
  
- **Volume Mounts section**:
  - Table with Type, Source, Destination, Mode columns
  - Shows all volume mounts
  - Shows "rw" or "ro" for read/write mode
  - Shows "-" if no volumes
  
- **Networks section**:
  - Table with Network name and IP address
  - Shows all connected networks
  
- **Environment Variables section**:
  - List of all environment variables
  - Format: KEY=VALUE
  - Scrollable if many variables
  - Shows "-" if no environment variables

**Action Buttons**:
- All action buttons (Start/Stop/Restart/Remove) should be present
- Buttons should be enabled/disabled based on container state
- "Back to List" button returns to main view

---

### Test 8: Container Logs

**Objective**: Verify log viewing functionality

**Steps**:
1. Find a running container
2. Click "Logs" button
3. Logs view should open

**Expected Result**:
- Logs are displayed in monospace font
- Logs are scrollable
- "Tail" dropdown is available with options: 50, 100, 500, 1000, All
- "Refresh" button is present
- "Back to List" button returns to main view

**Test 8a: Change Tail Length**

**Steps**:
1. Change tail dropdown from 100 to 500
2. Logs should refresh automatically

**Expected Result**:
- More log lines are shown (up to 500)
- No error occurs

**Test 8b: Refresh Logs**

**Steps**:
1. Wait a few seconds
2. Click "Refresh" button

**Expected Result**:
- Logs reload
- Latest logs are shown
- Button shows "Refreshing..." while loading

**Test 8c: Container with No Logs**

**Steps**:
1. View logs of a container with no output
2. Should see "No logs available"

---

### Test 9: Auto-Refresh

**Objective**: Verify automatic refresh works

**Steps**:
1. Note current container states
2. Use Docker CLI to change a container state:
   ```bash
   docker stop test-nginx
   ```
3. Wait up to 5 seconds

**Expected Result**:
- UI updates automatically without manual refresh
- Container state changes are reflected
- No page reload or flicker

---

### Test 10: Error Handling

**Objective**: Verify error messages are user-friendly

**Test 10a: Docker Daemon Stops**

**Steps**:
1. While app is running, stop Docker daemon
2. Wait 5 seconds for auto-refresh

**Expected Result**:
- Error banner appears at top
- Error message is clear: "Docker connection failed" or similar
- User can dismiss error
- UI remains functional

**Test 10b: Permission Denied**

**Steps** (Linux only):
1. Remove user from docker group
2. Restart application

**Expected Result**:
- Clear error message about permissions
- Suggestion to add user to docker group

**Test 10c: Invalid Operation**

**Steps**:
1. Try to start an already running container (if possible)

**Expected Result**:
- Error banner shows specific error
- Container state doesn't change incorrectly

---

### Test 11: UI/UX Verification

**Objective**: Verify user interface is intuitive and responsive

**Checklist**:
- [ ] Application window opens at 1200x800 size
- [ ] Window is resizable
- [ ] Dark theme is applied consistently
- [ ] All text is readable (good contrast)
- [ ] Buttons have hover effects
- [ ] Buttons show disabled state when appropriate
- [ ] Status indicators are color-coded correctly:
  - Green = Running
  - Gray = Stopped
  - Orange = Paused
- [ ] Tables are properly formatted with borders
- [ ] Long container names don't break layout
- [ ] Port badges are displayed inline
- [ ] Scrollbars appear when content overflows
- [ ] No console errors in dev tools

---

### Test 12: Cross-Platform Testing

**Objective**: Verify application works on all supported platforms

**Platforms to Test**:
- [ ] macOS 10.15+
- [ ] Linux (Ubuntu 20.04+)
- [ ] Windows 10/11

**For Each Platform**:
1. Build application: `npm run tauri:build`
2. Install/run the built application
3. Run all test cases 1-11
4. Verify Docker socket/named pipe is detected correctly
5. Verify all features work identically

---

## Performance Testing

### Load Test: Many Containers

**Steps**:
1. Create 50+ containers:
   ```bash
   for i in {1..50}; do
     docker create --name test-alpine-$i alpine:latest sleep 3600
   done
   ```
2. Launch application
3. Check "Show all containers"

**Expected Result**:
- All containers load within 2 seconds
- UI remains responsive
- Scrolling is smooth
- No memory leaks

**Cleanup**:
```bash
docker rm -f $(docker ps -aq --filter "name=test-alpine-")
```

---

## Test Results Template

### Test Execution Record

| Test ID | Test Name | Status | Notes | Tester | Date |
|---------|-----------|--------|-------|--------|------|
| T1 | Docker Connection | Not Tested | | | |
| T2a | List Running Containers | Not Tested | | | |
| T2b | List All Containers | Not Tested | | | |
| T3a | Stop Container | Not Tested | | | |
| T3b | Start Container | Not Tested | | | |
| T4 | Restart Container | Not Tested | | | |
| T5a | Pause Container | Not Tested | | | |
| T5b | Unpause Container | Not Tested | | | |
| T6 | Remove Container | Not Tested | | | |
| T7 | Container Details | Not Tested | | | |
| T8a | View Logs | Not Tested | | | |
| T8b | Refresh Logs | Not Tested | | | |
| T8c | No Logs | Not Tested | | | |
| T9 | Auto-Refresh | Not Tested | | | |
| T10a | Docker Stops | Not Tested | | | |
| T10b | Permission Error | Not Tested | | | |
| T11 | UI/UX | Not Tested | | | |
| T12 | Cross-Platform | Not Tested | | | |

Legend: Pass | Fail | Not Tested | Partial

---

## Known Issues to Verify

1. **No "Pause" button in UI**: Backend supports pause, but UI doesn't have pause button in action list
2. **Resource usage not shown**: CPU/Memory monitoring is Phase 2
3. **Long container IDs**: Verify truncation works correctly
4. **Port display**: Verify multiple ports display correctly

---

## Automated Testing (Future)

### Unit Tests (Future Enhancement)
```bash
# Frontend tests
npm test

# Backend tests
cd src-tauri
cargo test
```

### Integration Tests (Future Enhancement)
- Test Docker API interactions
- Test Tauri command handlers
- Test error scenarios

---

## Reporting Issues

When reporting issues, include:
1. Operating system and version
2. Docker version: `docker --version`
3. Application version
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshots if applicable
7. Console errors (if any)

---

## Sign-Off

**Phase 1 Testing Complete**: Pending

- [ ] All critical tests pass (T1-T8)
- [ ] Error handling works (T10)
- [ ] UI/UX acceptable (T11)
- [ ] Performance acceptable
- [ ] No blocking bugs

**Tested By**: _________________  
**Date**: _________________  
**Approved for Release**: Pending Yes / Pending No
