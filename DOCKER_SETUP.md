# 🐳 Docker Setup Guide - PEEC System

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop/)
- Docker Compose (included with Docker Desktop)

## 🚀 Development Setup

### Option 1: Using Makefile (Easiest)

```bash
# Start all services
make start

# View logs
make logs

# Stop services
make stop

# See all commands
make help
```

### Option 2: Using Docker Compose

```bash
# Start MySQL, Backend, and Frontend
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f mysql
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MySQL**: localhost:3306

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

### 3. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

## 📋 Docker Services

### MySQL Container
- **Image**: mysql:8.0
- **Port**: 3306
- **Database**: peec_system
- **User**: peec_user
- **Password**: peec_password
- **Root Password**: root123

### Backend Container
- **Port**: 5000
- **Auto-connects** to MySQL container
- **Hot-reload** enabled with volume mounts

### Frontend Container
- **Port**: 3000
- **Hot-reload** enabled for development
- **Connects** to backend via proxy

## 🗃️ MySQL Container Management

### Connect to MySQL

```bash
# Using docker exec
docker exec -it peec-mysql mysql -u peec_user -ppeec_password peec_system

# Or using MySQL client from host
mysql -h 127.0.0.1 -P 3306 -u peec_user -ppeec_password peec_system
```

### View Database

```bash
# Show all databases
docker exec -it peec-mysql mysql -u root -proot123 -e "SHOW DATABASES;"

# Show tables
docker exec -it peec-mysql mysql -u peec_user -ppeec_password peec_system -e "SHOW TABLES;"

# Query data
docker exec -it peec-mysql mysql -u peec_user -ppeec_password peec_system -e "SELECT * FROM programs;"
```

### Backup Database

```bash
# Create backup
docker exec peec-mysql mysqldump -u root -proot123 peec_system > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i peec-mysql mysql -u root -proot123 peec_system < backup_20250103.sql
```

### Reset Database

```bash
# Stop containers
docker-compose down

# Remove MySQL volume
docker volume rm peec_mysql_data

# Start again (will recreate database)
docker-compose up -d
```

## 🔧 Useful Docker Commands

### View Running Containers
```bash
docker-compose ps
```

### View Container Logs
```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs backend
docker-compose logs mysql
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart mysql
```

### Execute Commands in Containers
```bash
# Backend container bash
docker-compose exec backend sh

# MySQL container bash
docker-compose exec mysql bash

# Run npm commands in backend
docker-compose exec backend npm install some-package
```

### View Resource Usage
```bash
docker stats
```

### Clean Up
```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove everything (⚠️ careful!)
docker system prune -a
```

## 🏭 Production Deployment

### 1. Create Environment File

```bash
cp .env.docker .env
nano .env
```

Update with secure values:
```env
MYSQL_ROOT_PASSWORD=secure_root_password_here
MYSQL_USER=peec_user
MYSQL_PASSWORD=secure_password_here
JWT_SECRET=long_random_string_here
NODE_ENV=production
```

### 2. Start Production Stack

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Production with SSL

Create SSL certificates:
```bash
mkdir ssl
# Copy your SSL certificates to ./ssl/
# - ssl/certificate.crt
# - ssl/private.key
```

Update `client/nginx.conf` to include SSL configuration.

## 📊 Monitoring

### Check Health Status
```bash
# Check all containers
docker-compose ps

# Check MySQL health
docker inspect peec-mysql --format='{{.State.Health.Status}}'

# View MySQL logs
docker-compose logs mysql | tail -n 50
```

### Performance Monitoring
```bash
# Real-time stats
docker stats peec-mysql peec-backend peec-frontend

# Detailed container info
docker inspect peec-mysql
```

## 🔄 Database Migrations

### Run SQL Scripts
```bash
# Execute SQL file
docker exec -i peec-mysql mysql -u peec_user -ppeec_password peec_system < migration.sql

# Execute SQL command
docker exec peec-mysql mysql -u peec_user -ppeec_password peec_system -e "ALTER TABLE users ADD COLUMN phone VARCHAR(20);"
```

## 🐛 Troubleshooting

### MySQL Container Won't Start

```bash
# Check logs
docker-compose logs mysql

# Remove volume and restart
docker-compose down -v
docker-compose up -d
```

### Backend Can't Connect to MySQL

```bash
# Check if MySQL is healthy
docker-compose ps

# Wait for MySQL to be ready
docker-compose up -d mysql
sleep 30
docker-compose up -d backend
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3306  # MySQL
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill the process or change port in docker-compose.yml
```

### Container Keeps Restarting

```bash
# View logs to see error
docker-compose logs backend

# Check resource usage
docker stats

# Restart with fresh build
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Data Not Persisting

```bash
# Check volumes
docker volume ls

# Inspect volume
docker volume inspect peec_mysql_data

# Ensure docker-compose.yml has volumes section
```

## 📦 Docker Volumes

### List Volumes
```bash
docker volume ls
```

### Inspect Volume
```bash
docker volume inspect peec_mysql_data
```

### Backup Volume
```bash
# Create backup of MySQL data
docker run --rm -v peec_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .

# Restore backup
docker run --rm -v peec_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /data
```

## 🔐 Security Best Practices

1. **Change Default Passwords**
   - Update MySQL passwords in docker-compose.yml
   - Update JWT secret

2. **Use Environment Variables**
   - Never commit .env files
   - Use docker secrets in production

3. **Network Isolation**
   - Services communicate via internal network
   - Only expose necessary ports

4. **Regular Updates**
   ```bash
   docker-compose pull
   docker-compose up -d --build
   ```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify containers are running: `docker-compose ps`
3. Check MySQL connection: `docker exec -it peec-mysql mysql -u root -proot123`
4. Contact support: peec@aqbg.org

---

**Remember**: Data is persisted in Docker volumes. Use `docker-compose down -v` only when you want to delete all data!
