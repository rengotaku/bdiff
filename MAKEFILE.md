# Makefile Documentation

This project includes a comprehensive Makefile for automating development, build, and deployment tasks.

## Quick Start

```bash
# Show all available commands
make help

# Complete setup and start development
make quick-start

# Start development server
make dev

# Build for production
make build
```

## Core Commands

### Development
- `make dev` - Start development server with automatic port management (port 14000)
- `make dev-simple` - Start development server without port killing
- `make restart` - Restart development server (kill + start)
- `make kill-port` - Kill processes running on port 14000

### Build & Deployment
- `make build` - Build project for production (includes type checking)
- `make preview` - Preview production build
- `make prod-check` - Full production readiness check
- `make deploy-prep` - Prepare for deployment (clean + install + build)

### Quality Assurance
- `make typecheck` - Run TypeScript type checking
- `make test` - Run tests
- `make full-check` - Complete project health check (type + security + build)

### Project Management
- `make install` - Install dependencies
- `make setup` - Complete project setup (install + permissions)
- `make clean` - Clean build artifacts and node_modules
- `make status` - Show project and port status

### Dependencies
- `make deps-update` - Update all dependencies
- `make deps-audit` - Run security audit
- `make security-check` - Complete security check

### Network & Diagnostics
- `make network-check` - Check network accessibility
- `make env-info` - Display environment information

### Git Operations
- `make git-status` - Show git status with recent commits
- `make commit` - Helper for conventional commits

### All-in-One Commands
- `make quick-start` - Complete setup and start development
- `make fresh-start` - Clean + install + setup + dev
- `make full-check` - Complete project health check

## Configuration

### Port Settings
- Default port: **14000**
- Configured for both local and network access
- Automatic port conflict resolution

### Access URLs
The Makefile displays these URLs when starting development:
- Local: http://localhost:14000/
- GPU Server: http://gpuserver.lan:14000/
- Network: http://192.168.2.40:14000/

### Color Output
The Makefile uses colored output for better readability:
- 🔵 Blue: Information messages
- 🟡 Yellow: Warnings and status
- 🟢 Green: Success messages
- 🔴 Red: Error messages (when applicable)
- 🟦 Cyan: Headers and titles

## Advanced Features

### Parallel Processing
The Makefile supports parallel execution where appropriate:
```bash
make -j4 full-check  # Run with 4 parallel jobs
```

### Environment Variables
You can override the default port:
```bash
make dev PORT=3000
```

### Docker Support
```bash
make docker-build  # Build Docker image
make docker-run    # Run Docker container
```

### Bundle Analysis
```bash
make analyze  # Analyze bundle size (requires build first)
```

## Troubleshooting

### Permission Issues
```bash
make setup  # This will fix script permissions
```

### Port Conflicts
```bash
make kill-port  # Kill conflicting processes
make status     # Check port status
```

### Clean Start
```bash
make fresh-start  # Complete clean reinstall and start
```

### Network Issues
```bash
make network-check  # Test all configured URLs
make env-info       # Check environment details
```

## Customization

The Makefile can be customized by modifying these variables at the top:
- `PORT` - Default development port (default: 14000)
- Color codes for output styling
- Docker image names and settings

## Integration with npm Scripts

The Makefile integrates with package.json scripts:
- Uses npm scripts where available
- Provides enhanced functionality on top of basic npm commands
- Adds port management, status checking, and multi-step workflows

## Best Practices

1. **Always use `make help`** to see available commands
2. **Use `make status`** to check project state before starting work
3. **Use `make full-check`** before committing changes
4. **Use `make fresh-start`** when encountering dependency issues
5. **Use `make network-check`** to verify accessibility from different hosts

This Makefile provides a comprehensive development and deployment automation system for the bdiff project, making common tasks simple and reliable.