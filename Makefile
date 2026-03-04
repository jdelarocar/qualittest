.PHONY: help start stop restart logs clean rebuild db-connect db-backup status

help: ## Show this help message
	@echo '📋 Available commands:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ''

start: ## Start all services (MySQL, Backend, Frontend)
	@echo '🚀 Starting QUALITTEST System...'
	docker-compose up -d
	@echo '✅ QUALITTEST System is running!'
	@echo '   Frontend: http://localhost:3000'
	@echo '   Backend:  http://localhost:5001'
	@echo '   MySQL:    localhost:3306'

stop: ## Stop all services
	@echo '🛑 Stopping QUALITTEST System...'
	docker-compose down
	@echo '✅ All services stopped'

restart: ## Restart all services
	@echo '🔄 Restarting QUALITTEST System...'
	docker-compose restart
	@echo '✅ All services restarted'

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose logs -f frontend

logs-mysql: ## View MySQL logs only
	docker-compose logs -f mysql

status: ## Show status of all containers
	@echo '📊 Container Status:'
	@docker-compose ps

clean: ## Stop services and remove containers (keeps data)
	@echo '🧹 Cleaning up containers...'
	docker-compose down
	@echo '✅ Containers removed (data preserved)'

clean-all: ## Remove everything including data volumes ⚠️
	@echo '⚠️  WARNING: This will delete all database data!'
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo '✅ Everything removed including data'; \
	else \
		echo '❌ Cancelled'; \
	fi

rebuild: ## Rebuild containers from scratch
	@echo '🔨 Rebuilding containers...'
	docker-compose build --no-cache
	docker-compose up -d
	@echo '✅ Rebuild complete'

db-connect: ## Connect to MySQL database
	@echo '🔌 Connecting to MySQL...'
	docker exec -it qualittest-mysql mysql -u qualittest_user -pqualittest_password qualittest_system

db-shell: ## Open MySQL shell as root
	docker exec -it qualittest-mysql mysql -u root -proot123

db-backup: ## Backup database to file
	@echo '💾 Creating database backup...'
	@mkdir -p backups
	docker exec qualittest-mysql mysqldump -u root -proot123 qualittest_system > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo '✅ Backup created in backups/ directory'

db-restore: ## Restore database from latest backup
	@echo '📥 Restoring database from latest backup...'
	@LATEST=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$LATEST" ]; then \
		echo "❌ No backup files found in backups/ directory"; \
		exit 1; \
	fi; \
	echo "Restoring from: $$LATEST"; \
	docker exec -i qualittest-mysql mysql -u root -proot123 qualittest_system < "$$LATEST"; \
	echo '✅ Database restored'

install: ## Install all dependencies (without Docker)
	@echo '📦 Installing dependencies...'
	npm install
	cd client && npm install
	@echo '✅ Dependencies installed'

dev: ## Run in development mode (without Docker)
	npm run dev

backend-shell: ## Open shell in backend container
	docker-compose exec backend sh

frontend-shell: ## Open shell in frontend container
	docker-compose exec frontend sh

mysql-shell: ## Open bash shell in MySQL container
	docker-compose exec mysql bash

prune: ## Remove unused Docker resources
	@echo '🧹 Pruning unused Docker resources...'
	docker system prune -f
	@echo '✅ Cleanup complete'

prod: ## Start production stack
	@echo '🏭 Starting production stack...'
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo '✅ Production stack running'

prod-stop: ## Stop production stack
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f
