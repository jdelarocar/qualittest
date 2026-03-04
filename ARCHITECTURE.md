# 🏗️ PEEC System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PEEC System                          │
│                Docker Compose Network                    │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   Frontend       │      │   Backend API    │      │   MySQL DB       │
│   React + MUI    │◄────►│   Node.js        │◄────►│   Database       │
│   Port 3000      │      │   Express        │      │   Port 3306      │
│                  │      │   Port 5000      │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
   peec-frontend            peec-backend              peec-mysql
```

## 🐳 Docker Architecture

### Container Details

```
┌─────────────────────────────────────────────────────────────────┐
│                     peec-network (bridge)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Frontend Container (peec-frontend)                     │   │
│  │ ┌────────────────────────────────────────────────┐    │   │
│  │ │ React Development Server                       │    │   │
│  │ │ - Material-UI components                       │    │   │
│  │ │ - React Router                                 │    │   │
│  │ │ - Recharts for visualizations                 │    │   │
│  │ │ - Hot reload enabled                          │    │   │
│  │ └────────────────────────────────────────────────┘    │   │
│  │ Port: 3000 → http://localhost:3000                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                           ▲                                    │
│                           │ HTTP/Proxy                         │
│                           ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Backend Container (peec-backend)                       │   │
│  │ ┌────────────────────────────────────────────────┐    │   │
│  │ │ Node.js Express API                            │    │   │
│  │ │ - JWT Authentication                           │    │   │
│  │ │ - RESTful API endpoints                       │    │   │
│  │ │ - Statistical calculations                    │    │   │
│  │ │ - Business logic                              │    │   │
│  │ └────────────────────────────────────────────────┘    │   │
│  │ Port: 5000 → http://localhost:5000                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                           ▲                                    │
│                           │ SQL Queries                        │
│                           ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ MySQL Container (peec-mysql)                           │   │
│  │ ┌────────────────────────────────────────────────┐    │   │
│  │ │ MySQL 8.0 Database                             │    │   │
│  │ │ - 15 tables                                    │    │   │
│  │ │ - Auto-initialized schema                     │    │   │
│  │ │ - Data persistence via volume                 │    │   │
│  │ │ - Health checks                               │    │   │
│  │ └────────────────────────────────────────────────┘    │   │
│  │ Port: 3306 → localhost:3306                           │   │
│  │ Volume: mysql_data (persistent storage)               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### User Login Flow
```
┌─────────┐     HTTP POST      ┌─────────┐     SQL Query    ┌─────────┐
│         │─────────────────────►│         │──────────────────►│         │
│ Browser │  /api/auth/login    │ Backend │  SELECT user     │  MySQL  │
│         │◄─────────────────────│         │◄──────────────────│         │
└─────────┘     JWT Token       └─────────┘     User data    └─────────┘
```

### Results Submission Flow
```
┌─────────┐     HTTP POST          ┌─────────┐     SQL INSERT    ┌─────────┐
│         │────────────────────────►│         │───────────────────►│         │
│ Browser │  /api/results/:id      │ Backend │  INSERT results   │  MySQL  │
│         │◄────────────────────────│         │◄───────────────────│         │
└─────────┘     Success/Error      └─────────┘     Confirmation   └─────────┘
```

### Statistics Calculation Flow
```
┌─────────┐     HTTP GET           ┌─────────┐     SQL Queries   ┌─────────┐
│         │────────────────────────►│         │───────────────────►│         │
│ Browser │  /api/statistics       │ Backend │  SELECT results   │  MySQL  │
│         │                         │         │  Calculate IDS    │         │
│         │◄────────────────────────│         │◄───────────────────│         │
└─────────┘     JSON with stats    └─────────┘     Aggregated     └─────────┘
                & chart data                        data
```

## 🔐 Security Layers

```
┌──────────────────────────────────────────────────┐
│                   Security                       │
├──────────────────────────────────────────────────┤
│  Frontend                                        │
│  ├─ Route Protection (ProtectedRoute)           │
│  ├─ JWT Token Storage (localStorage)            │
│  └─ Input Validation                            │
├──────────────────────────────────────────────────┤
│  Backend                                         │
│  ├─ JWT Authentication Middleware                │
│  ├─ Role-based Authorization                     │
│  ├─ bcrypt Password Hashing                      │
│  ├─ SQL Injection Protection (Prepared)          │
│  └─ CORS Configuration                           │
├──────────────────────────────────────────────────┤
│  Database                                        │
│  ├─ User/Password Authentication                 │
│  ├─ Network Isolation (Docker)                   │
│  └─ Data Persistence (Volumes)                   │
└──────────────────────────────────────────────────┘
```

## 📦 Component Architecture

### Frontend Components Tree
```
App.js
├── AuthProvider (Context)
│   └── BrowserRouter
│       ├── PublicRoute
│       │   └── Login
│       └── ProtectedRoute
│           └── Layout
│               ├── AppBar
│               ├── Drawer (Sidebar)
│               └── Outlet
│                   ├── Dashboard
│                   ├── Parameters
│                   ├── ResultsEntry
│                   └── Statistics
```

### Backend API Structure
```
server/index.js
├── Middleware
│   ├── CORS
│   ├── JSON Parser
│   └── Auth Middleware
├── Routes
│   ├── /api/auth (Authentication)
│   ├── /api/laboratories (Laboratory info)
│   ├── /api/programs (Programs list)
│   ├── /api/analytes (Analytes by program)
│   ├── /api/parameters (Lab parameters)
│   ├── /api/shipments (Sample shipments)
│   ├── /api/results (Results submission)
│   └── /api/statistics (Statistics & charts)
└── Database Connection (MySQL Pool)
```

### Database Schema
```
peec_system (Database)
├── laboratories (Lab info)
├── users (User accounts)
├── programs (8 programs)
├── analytes (39 for biochemistry)
├── methods (Analysis methods)
├── lab_parameters (Lab settings)
├── shipments (Sample shipments)
├── results (Submitted results)
├── statistics (Calculated stats)
├── performance_metrics (IDS, DRP, Z)
├── payments (Payment tracking)
└── certificates (Certificates)
```

## 🌐 Network Communication

### Internal Docker Network
```
┌────────────────────────────────────────────┐
│        peec-network (172.x.x.x)            │
├────────────────────────────────────────────┤
│                                            │
│  frontend:3000 ─────► backend:5000         │
│       │                    │               │
│       │                    │               │
│       │                    ▼               │
│       │               mysql:3306           │
│       │                                    │
│  External: localhost:3000                  │
│  External: localhost:5000                  │
│  External: localhost:3306                  │
│                                            │
└────────────────────────────────────────────┘
```

## 🔄 Development Workflow

```
1. Code Change
   ├─ Frontend (src/)
   │  └─ Hot Module Replacement → Browser Refresh
   │
   └─ Backend (server/)
      └─ Volume Mount → Auto-restart (with nodemon)

2. Database Change
   └─ Connect to container → Run SQL → Instant update

3. Docker Update
   └─ docker-compose restart service → Service reloads
```

## 📈 Scaling Options

### Horizontal Scaling (Future)
```
                    ┌─ Backend 1 ─┐
Load Balancer ─────┼─ Backend 2 ─┼──── MySQL (Master)
                    └─ Backend 3 ─┘          │
                                             └── MySQL (Replica)
```

### Current Setup (Single Instance)
```
Frontend ──► Backend ──► MySQL
(1 instance) (1 instance) (1 instance)
```

## 🎯 Key Features by Layer

### Presentation Layer (React)
- ✅ Material-UI components with PEEC theme
- ✅ Responsive design
- ✅ Client-side routing
- ✅ Form validation
- ✅ Charts (Recharts)
- ✅ Authentication state management

### Application Layer (Node.js)
- ✅ RESTful API
- ✅ JWT authentication
- ✅ Role-based access
- ✅ Statistical calculations
- ✅ Error handling
- ✅ Request validation

### Data Layer (MySQL)
- ✅ Normalized schema
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Transactions
- ✅ Stored procedures ready

## 📝 Summary

The PEEC System uses a **3-tier architecture** with complete **Docker containerization**:

1. **Frontend** - React SPA with Material-UI
2. **Backend** - Node.js REST API with business logic
3. **Database** - MySQL 8.0 with complete schema

All layers communicate through a Docker network, with data persistence via volumes. The system is **production-ready** and can be deployed with a single command.

---

**Total Containers**: 3
**Total Volumes**: 1 (MySQL data)
**Total Networks**: 1 (bridge)
**Exposed Ports**: 3000, 5000, 3306
