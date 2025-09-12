# Development Server Configuration

## Port 14000 Configuration

The development server has been configured to run on port **14000** with automatic port management.

## Features

### 🔥 Automatic Process Killing
- Automatically detects and kills any existing processes running on port 14000
- Ensures clean startup without port conflicts
- Cross-platform support (Linux/macOS and Windows)

### 🚀 Smart Port Management
- Default port: **14000**
- Configured in `vite.config.ts`
- Host binding: `0.0.0.0` (accessible from network)
- Non-strict port mode for flexibility

## Usage

### Standard Development
```bash
npm run dev
```
This will:
1. Check for existing processes on port 14000
2. Kill any conflicting processes
3. Start Vite dev server on port 14000
4. Display network URLs for access

### Simple Development (without kill functionality)
```bash
npm run dev:simple
```
Direct Vite startup on port 14000 without process killing.

## Scripts

### Unix/Linux/macOS: `scripts/dev-server.sh`
- Uses `lsof` to detect port usage
- Uses `kill -9` to terminate processes
- Executable shell script with proper permissions

### Windows: `scripts/dev-server.bat`
- Uses `netstat` and `taskkill` for Windows compatibility
- Batch file for Windows command prompt
- Same functionality as Unix script

## Configuration Files

### `package.json`
```json
{
  "scripts": {
    "dev": "./scripts/dev-server.sh",
    "dev:simple": "vite --port 14000"
  }
}
```

### `vite.config.ts`
```typescript
export default defineConfig({
  server: {
    port: 14000,
    host: '0.0.0.0',
    strictPort: false
  }
})
```

## Access URLs

Once started, the development server will be available at:

- **Local**: http://localhost:14000/
- **GPU Server**: http://gpuserver.lan:14000/
- **Network**: http://192.168.2.40:14000/ (accessible from other devices)
- **All Network Interfaces**: Available on all detected network interfaces

### Allowed Hosts Configuration
The server is configured to accept requests from:
- `localhost` and `.localhost`
- `gpuserver.lan` and `.gpuserver.lan`
- `192.168.2.40` (specific IP address)
- `.local` (local network domains)

### CORS Configuration
Cross-Origin Resource Sharing (CORS) is configured for:
- `http://localhost:14000`
- `http://gpuserver.lan:14000`
- `http://192.168.2.40:14000`

## Troubleshooting

### Port Still in Use
If you see "Port 14000 is already in use" after running the script:
1. Check if there are permission issues
2. Manually kill processes: `lsof -ti:14000 | xargs kill -9`
3. Try the simple dev script: `npm run dev:simple`

### Permission Issues (Unix/Linux)
```bash
chmod +x scripts/dev-server.sh
```

### Windows Execution Policy
If you encounter execution policy issues on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Implementation Details

The port management system:
1. **Detection**: Uses system commands to detect port usage
2. **Termination**: Forcefully kills conflicting processes
3. **Verification**: Double-checks port availability
4. **Startup**: Launches Vite with proper configuration
5. **Feedback**: Provides clear status messages throughout the process

This ensures a smooth development experience without manual port management.