# ⚡ PEEC System - Quick Reference Card

## 🚀 Start Application

```bash
# Easiest way
make start

# Or using Docker Compose
docker-compose up -d

# Or using script
./start-docker.sh
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MySQL**: localhost:3306

## 👤 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Lab Code**: `1010333`

## 📝 Common Commands

```bash
# View all commands
make help

# Start services
make start

# Stop services
make stop

# View logs
make logs

# Check status
make status

# Restart services
make restart

# Connect to MySQL
make db-connect

# Backup database
make db-backup

# Clean containers (keep data)
make clean
```

## 🐳 Docker Commands

```bash
# View containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec mysql bash

# View resource usage
docker stats
```

## 🗄️ MySQL Quick Access

```bash
# Connect to database
docker exec -it peec-mysql mysql -u peec_user -ppeec_password peec_system

# Or using make
make db-connect

# View tables
make db-connect
> SHOW TABLES;

# Query data
> SELECT * FROM programs;
> SELECT * FROM users;
> SELECT * FROM laboratories;
```

## 📊 Database Info

```sql
-- Database: peec_system
-- User: peec_user
-- Password: peec_password
-- Tables: 15
-- Programs: 8
-- Analytes: 39 (Biochemistry)
```

## 🔧 Troubleshooting

```bash
# Containers won't start?
docker-compose logs

# Port already in use?
lsof -i :3306  # MySQL
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Reset everything
make clean-all  # ⚠️ Deletes data!
make start

# Rebuild containers
make rebuild
```

## 📂 Project Structure

```
PEEC/
├── server/          Backend API
├── client/          Frontend React
├── docker-compose.yml
├── Makefile         Easy commands
└── *.md             Documentation
```

## 📚 Documentation Files

1. **README.md** - Complete guide
2. **QUICKSTART.md** - 2-min setup
3. **DOCKER_SETUP.md** - Docker guide
4. **ARCHITECTURE.md** - System design
5. **DEPLOYMENT.md** - Production deploy
6. **FINAL_SUMMARY.md** - Project summary

## 🎯 Key Features

- ✅ Login & Authentication
- ✅ Parameter Configuration
- ✅ Results Submission
- ✅ Statistics & Charts
- ✅ Performance Metrics (IDS, DRP, Z-Score)
- ✅ Dashboard Overview

## 🔐 Security

- JWT tokens for auth
- bcrypt password hashing
- Role-based access
- Protected API endpoints

## 📞 Support

- **Email**: peec@aqbg.org
- **Phone**: 2448-2502
- **Web**: www.peecsystem.com

## ⚙️ Environment

### Development
- Frontend: React dev server (hot reload)
- Backend: Node.js (watch mode)
- MySQL: Docker container

### Production
```bash
make prod         # Start production
make prod-logs    # View logs
make prod-stop    # Stop production
```

## 🎨 Design Colors

From PEEC Logo:
- **Primary**: #1a3a52 (Navy Blue)
- **Secondary**: #00a8cc (Cyan)
- **Success**: #6ba946 (Green)

## 📈 API Endpoints

```
Authentication
POST   /api/auth/login
GET    /api/auth/me

Programs
GET    /api/programs

Parameters
GET    /api/parameters
POST   /api/parameters

Shipments
GET    /api/shipments
GET    /api/shipments/:id

Results
GET    /api/results/shipment/:id
POST   /api/results/shipment/:id

Statistics
GET    /api/statistics/shipment/:id/analyte/:id
GET    /api/statistics/history/ids
```

## 💡 Pro Tips

1. Use `make help` to see all commands
2. Use `make logs` to debug issues
3. Use `make db-backup` before major changes
4. Check `docker-compose ps` for status
5. Read DOCKER_SETUP.md for details

---

**Quick Start**: `make start` → http://localhost:3000 → admin/admin123

**Stop**: `make stop`

**Help**: `make help`
