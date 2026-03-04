# 📦 Guía de Despliegue - PEEC System

## Despliegue en Producción

### Opción 1: Servidor Tradicional (VPS)

#### Requisitos del Servidor
- Ubuntu 20.04+ o CentOS 8+
- Node.js 18+
- MySQL 8.0+
- Nginx (recomendado)
- 2GB RAM mínimo
- 20GB disco

#### Paso 1: Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install -y mysql-server

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

#### Paso 2: Configurar MySQL

```bash
# Conectar a MySQL
sudo mysql

# Crear usuario y base de datos
CREATE DATABASE peec_system;
CREATE USER 'peec_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON peec_system.* TO 'peec_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Importar schema
mysql -u peec_user -p peec_system < server/config/schema.sql
```

#### Paso 3: Configurar Aplicación

```bash
# Clonar repositorio
cd /var/www
git clone [tu-repositorio] peec

# Configurar variables de entorno
cd peec
cp .env.example .env
nano .env
```

Configuración para producción:
```env
NODE_ENV=production
DB_HOST=localhost
DB_USER=peec_user
DB_PASSWORD=contraseña_segura
DB_NAME=peec_system
PORT=5000
JWT_SECRET=clave_muy_segura_y_larga_generada_aleatoriamente
```

```bash
# Instalar dependencias
npm run install-all

# Construir frontend
cd client
npm run build
cd ..
```

#### Paso 4: Configurar PM2

```bash
# Crear archivo ecosystem
nano ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'peec-api',
    script: 'server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

#### Paso 5: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/peec
```

Configuración:
```nginx
server {
    listen 80;
    server_name peecsystem.com www.peecsystem.com;

    # Frontend
    location / {
        root /var/www/peec/client/build;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/peec /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### Paso 6: Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d peecsystem.com -d www.peecsystem.com

# Renovación automática
sudo certbot renew --dry-run
```

### Opción 2: Docker

#### Crear Dockerfile

**Backend (Dockerfile):**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server ./server

EXPOSE 5000

CMD ["node", "server/index.js"]
```

**Frontend (client/Dockerfile):**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: peec_system
      MYSQL_USER: peec_user
      MYSQL_PASSWORD: peec_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/config/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: .
    environment:
      DB_HOST: db
      DB_USER: peec_user
      DB_PASSWORD: peec_password
      DB_NAME: peec_system
      PORT: 5000
      JWT_SECRET: your_jwt_secret
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

```bash
# Iniciar con Docker Compose
docker-compose up -d
```

### Opción 3: Plataformas Cloud

#### Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear aplicación
heroku create peec-system

# Agregar MySQL
heroku addons:create jawsdb:kitefin

# Configurar variables
heroku config:set JWT_SECRET=tu_secreto

# Desplegar
git push heroku main
```

#### DigitalOcean App Platform

1. Conectar repositorio GitHub
2. Configurar:
   - **Backend**: Node.js, puerto 5000
   - **Frontend**: Static Site
   - **Database**: Managed MySQL
3. Configurar variables de entorno
4. Deploy automático

## 🔒 Seguridad en Producción

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Usar JWT_SECRET aleatorio y fuerte
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar firewall (UFW)
- [ ] Limitar acceso a MySQL (solo localhost)
- [ ] Configurar backups automáticos
- [ ] Habilitar logs de auditoría
- [ ] Actualizar dependencias regularmente
- [ ] Configurar rate limiting
- [ ] Implementar CORS correctamente

### Firewall (UFW)

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 Monitoreo

### Logs con PM2

```bash
# Ver logs en tiempo real
pm2 logs peec-api

# Monitoreo de recursos
pm2 monit

# Ver estado
pm2 status
```

### MySQL Monitoring

```bash
# Slow query log
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Agregar:
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

## 🔄 Backups

### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/peec"

# Crear directorio
mkdir -p $BACKUP_DIR

# Backup MySQL
mysqldump -u peec_user -p[password] peec_system > $BACKUP_DIR/db_$DATE.sql

# Backup archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/peec

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completado: $DATE"
```

```bash
# Hacer ejecutable
chmod +x backup.sh

# Programar en crontab (diario a las 2 AM)
crontab -e
# Agregar:
0 2 * * * /path/to/backup.sh
```

## 🔄 Actualización

```bash
# Con PM2
cd /var/www/peec
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart peec-api
```

## 📈 Optimización

### Habilitar Compresión Gzip (Nginx)

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/json application/javascript;
```

### Caché de Recursos Estáticos

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 Soporte

Para problemas de despliegue:
- Email: peec@aqbg.org
- Tel: 2448-2502
