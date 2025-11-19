# Makefile for bdiff project
# Development and build automation

.PHONY: help install dev build preview clean test lint typecheck kill-port setup deps-update deps-audit security-check docker-build docker-run git-status commit

# Default port for development server
PORT := 14000

# Color output
COLOR_RESET := \033[0m
COLOR_GREEN := \033[32m
COLOR_YELLOW := \033[33m
COLOR_RED := \033[31m
COLOR_BLUE := \033[34m
COLOR_CYAN := \033[36m

# Default target
help: ## Display this help message
	@echo "$(COLOR_CYAN)bdiff - File Diff Comparison Tool$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Available commands:$(COLOR_RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(COLOR_GREEN)%-20s$(COLOR_RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(COLOR_YELLOW)Development URLs:$(COLOR_RESET)"
	@echo "  Local:     http://localhost:$(PORT)/"
	@echo "  GPU Server: http://gpuserver.lan:$(PORT)/"
	@echo "  Network:   http://192.168.2.40:$(PORT)/"

# Installation and setup
install: ## Install dependencies
	@echo "$(COLOR_BLUE)Installing dependencies...$(COLOR_RESET)"
	@npm install

setup: install ## Complete project setup
	@echo "$(COLOR_BLUE)Setting up development environment...$(COLOR_RESET)"
	@chmod +x scripts/dev-server.sh
	@echo "$(COLOR_GREEN)Setup complete!$(COLOR_RESET)"

# Development commands
dev: ## Start development server with port management
	@echo "$(COLOR_YELLOW)Checking and killing processes on port $(PORT)...$(COLOR_RESET)"
	@lsof -ti:$(PORT) | xargs -r kill -9 2>/dev/null || echo "Port $(PORT) is free"
	@sleep 1
	@echo "$(COLOR_BLUE)Starting development server on port $(PORT)...$(COLOR_RESET)"
	@npm run dev

kill-port: ## Kill processes running on port 14000
	@echo "$(COLOR_YELLOW)Checking and killing processes on port $(PORT)...$(COLOR_RESET)"
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || echo "Port $(PORT) is free"

# Build and deployment
build: typecheck ## Build project for production
	@echo "$(COLOR_BLUE)Building project for production...$(COLOR_RESET)"
	@npm run build
	@echo "$(COLOR_GREEN)Build completed! Output in dist/$(COLOR_RESET)"

preview: build ## Preview production build
	@echo "$(COLOR_BLUE)Starting preview server...$(COLOR_RESET)"
	@npm run preview

# Quality assurance
typecheck: ## Run TypeScript type checking
	@echo "$(COLOR_BLUE)Running TypeScript type checking...$(COLOR_RESET)"
	@npx tsc --noEmit

lint: ## Run linting (if available)
	@echo "$(COLOR_YELLOW)No lint script configured$(COLOR_RESET)"
	@echo "Consider adding ESLint: npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin"

test: ## Run tests
	@echo "$(COLOR_YELLOW)Running tests...$(COLOR_RESET)"
	@npm test

# Dependency management
deps-update: ## Update dependencies
	@echo "$(COLOR_BLUE)Updating dependencies...$(COLOR_RESET)"
	@npm update
	@npm outdated || true

deps-audit: ## Run security audit
	@echo "$(COLOR_BLUE)Running security audit...$(COLOR_RESET)"
	@npm audit

security-check: deps-audit ## Complete security check
	@echo "$(COLOR_BLUE)Running comprehensive security check...$(COLOR_RESET)"
	@npm audit --audit-level moderate

# Cleanup commands
clean: ## Clean build artifacts and node_modules
	@echo "$(COLOR_YELLOW)Cleaning project...$(COLOR_RESET)"
	@rm -rf dist/
	@rm -rf node_modules/
	@echo "$(COLOR_GREEN)Cleanup complete!$(COLOR_RESET)"

clean-cache: ## Clean npm cache
	@echo "$(COLOR_YELLOW)Cleaning npm cache...$(COLOR_RESET)"
	@npm cache clean --force

# Git operations
git-status: ## Show git status with file changes
	@echo "$(COLOR_CYAN)Git Repository Status:$(COLOR_RESET)"
	@git status --short --branch
	@echo ""
	@git log --oneline -5

commit: ## Commit with conventional commit message
	@echo "$(COLOR_BLUE)Preparing commit...$(COLOR_RESET)"
	@git status
	@echo "$(COLOR_YELLOW)Use: git add <files> and git commit -m 'type: description'$(COLOR_RESET)"

# Docker operations (if needed)
docker-build: ## Build Docker image
	@echo "$(COLOR_BLUE)Building Docker image...$(COLOR_RESET)"
	@docker build -t bdiff:latest .

docker-run: docker-build ## Run Docker container
	@echo "$(COLOR_BLUE)Running Docker container...$(COLOR_RESET)"
	@docker run -p $(PORT):$(PORT) bdiff:latest

# Development workflow shortcuts
quick-start: setup dev ## Complete setup and start development

restart: kill-port dev ## Restart development server

status: ## Show project status
	@echo "$(COLOR_CYAN)Project Status:$(COLOR_RESET)"
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Project: $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')"
	@echo ""
	@echo "$(COLOR_YELLOW)Port Status:$(COLOR_RESET)"
	@lsof -i:$(PORT) || echo "Port $(PORT) is free"

# Network diagnostics
network-check: ## Check network accessibility
	@echo "$(COLOR_CYAN)Network Accessibility Check:$(COLOR_RESET)"
	@echo "Testing localhost..."
	@curl -s -o /dev/null -w "localhost:$(PORT) - Status: %{http_code}\n" http://localhost:$(PORT)/ || echo "localhost:$(PORT) - Not accessible"
	@echo "Testing gpuserver.lan..."
	@curl -s -o /dev/null -w "gpuserver.lan:$(PORT) - Status: %{http_code}\n" http://gpuserver.lan:$(PORT)/ || echo "gpuserver.lan:$(PORT) - Not accessible"

# Production deployment helpers
prod-check: typecheck build ## Full production readiness check
	@echo "$(COLOR_GREEN)Production readiness check complete!$(COLOR_RESET)"

deploy-prep: clean install build ## Prepare for deployment
	@echo "$(COLOR_GREEN)Deployment preparation complete!$(COLOR_RESET)"
	@ls -la dist/

# Advanced development
dev-debug: ## Start development with debug information
	@echo "$(COLOR_BLUE)Starting development server with debug info...$(COLOR_RESET)"
	@DEBUG=vite:* npm run dev

analyze: build ## Analyze bundle size
	@echo "$(COLOR_BLUE)Analyzing bundle size...$(COLOR_RESET)"
	@npx vite-bundle-analyzer dist/

# Environment info
env-info: ## Display environment information
	@echo "$(COLOR_CYAN)Environment Information:$(COLOR_RESET)"
	@echo "OS: $$(uname -s) $$(uname -r)"
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo "Git: $$(git --version)"
	@echo "Working Directory: $$(pwd)"
	@echo "Free Disk Space: $$(df -h . | tail -1 | awk '{print $$4}')"
	@echo "Memory: $$(free -h | grep '^Mem:' | awk '{print $$7}') available"

# All-in-one commands
full-check: typecheck security-check build ## Complete project health check
	@echo "$(COLOR_GREEN)Full project check complete!$(COLOR_RESET)"

fresh-start: clean install setup dev ## Complete fresh start
	@echo "$(COLOR_GREEN)Fresh start complete!$(COLOR_RESET)"