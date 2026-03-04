# Guía de Despliegue QUALITTEST

Esta guía te muestra cómo desplegar QUALITTEST en diferentes plataformas gratuitas.

## Opciones de Despliegue Gratuito

### Opción 1: Railway.app (Recomendado - Más Fácil)

**Ventajas:**
- ✅ Completamente gratis para proyectos pequeños ($5 USD de crédito mensual)
- ✅ Soporta Docker y MySQL nativamente
- ✅ URL automática (ej: `qualittest.up.railway.app`)
- ✅ Despliegue desde GitHub en minutos
- ✅ Base de datos MySQL incluida
- ✅ Variables de entorno fáciles de configurar

**Pasos:**

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Regístrate con tu cuenta de GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio de GitHub

3. **Agregar MySQL**
   - En tu proyecto, click en "+ New"
   - Selecciona "Database" → "MySQL"
   - Railway creará automáticamente la base de datos

4. **Configurar Backend**
   - Railway detectará automáticamente tu Dockerfile
   - Agrega las siguientes variables de entorno:
     ```
     NODE_ENV=production
     DB_HOST=${{MySQL.MYSQL_HOST}}
     DB_USER=${{MySQL.MYSQL_USER}}
     DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
     DB_NAME=qualittest_system
     DB_PORT=${{MySQL.MYSQL_PORT}}
     PORT=5000
     JWT_SECRET=tu_secreto_jwt_seguro_aqui_cambiar
     JWT_EXPIRE=7d
     ```

5. **Configurar Frontend**
   - Crea otro servicio para el frontend
   - Agrega variable de entorno:
     ```
     REACT_APP_API_URL=${{backend.url}}/api
     ```

6. **Inicializar Base de Datos**
   - Conecta a MySQL usando Railway CLI o el panel web
   - Ejecuta el archivo `server/config/schema.sql`

---

### Opción 2: Render.com

**Ventajas:**
- ✅ Plan gratuito permanente
- ✅ 750 horas de servicio gratis al mes
- ✅ PostgreSQL o MySQL gratis
- ✅ URL automática (ej: `qualittest.onrender.com`)
- ⚠️ Los servicios gratuitos se "duermen" después de 15 min de inactividad

**Pasos:**

1. **Crear cuenta en Render**
   - Ve a https://render.com
   - Regístrate con GitHub

2. **Crear Base de Datos MySQL**
   - Dashboard → "New +" → "MySQL"
   - Nombre: `qualittest-db`
   - Plan: Free
   - Copia las credenciales de conexión

3. **Desplegar Backend**
   - "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     ```
     Name: qualittest-backend
     Region: US West (Oregon)
     Branch: main
     Root Directory: (deja vacío)
     Runtime: Docker
     Instance Type: Free
     ```
   - Variables de entorno:
     ```
     NODE_ENV=production
     DB_HOST=[MySQL host from Render]
     DB_USER=[MySQL user from Render]
     DB_PASSWORD=[MySQL password from Render]
     DB_NAME=qualittest_system
     DB_PORT=3306
     PORT=5000
     JWT_SECRET=tu_secreto_jwt_seguro
     JWT_EXPIRE=7d
     ```

4. **Desplegar Frontend**
   - "New +" → "Static Site"
   - Conecta tu repositorio
   - Configuración:
     ```
     Name: qualittest-frontend
     Branch: main
     Root Directory: client
     Build Command: npm install && npm run build
     Publish Directory: build
     ```
   - Variables de entorno:
     ```
     REACT_APP_API_URL=https://qualittest-backend.onrender.com/api
     ```

---

### Opción 3: Fly.io

**Ventajas:**
- ✅ Completamente gratis hasta 3 máquinas pequeñas
- ✅ Excelente para Docker
- ✅ Muy rápido globalmente
- ✅ CLI poderoso
- ⚠️ Requiere tarjeta de crédito (pero no te cobran en plan gratis)

**Pasos:**

1. **Instalar Fly CLI**
   ```bash
   # En macOS
   brew install flyctl

   # O usando curl
   curl -L https://fly.io/install.sh | sh
   ```

2. **Registrarse y autenticarse**
   ```bash
   fly auth signup
   fly auth login
   ```

3. **Desplegar MySQL**
   ```bash
   fly launch --image mysql:8.0 --name qualittest-db
   fly volumes create mysql_data --region sjc --size 1
   ```

4. **Desplegar Backend**
   ```bash
   cd /ruta/a/tu/proyecto
   fly launch --name qualittest-backend --dockerfile Dockerfile

   # Configurar secretos
   fly secrets set \
     NODE_ENV=production \
     DB_HOST=qualittest-db.internal \
     DB_USER=qualittest_user \
     DB_PASSWORD=tu_password_seguro \
     DB_NAME=qualittest_system \
     JWT_SECRET=tu_secreto_jwt

   fly deploy
   ```

5. **Desplegar Frontend**
   ```bash
   cd client
   fly launch --name qualittest-frontend

   # Configurar variable de entorno
   fly secrets set REACT_APP_API_URL=https://qualittest-backend.fly.dev/api

   fly deploy
   ```

---

### Opción 4: Oracle Cloud (Siempre Gratis - Más Potente)

**Ventajas:**
- ✅ Completamente gratis para siempre (no es trial)
- ✅ 2 VM con 1GB RAM cada una
- ✅ 200GB de almacenamiento
- ✅ Mucho más potente que las otras opciones
- ⚠️ Configuración más técnica (requiere SSH y Docker manual)

**Pasos:**

1. **Crear cuenta en Oracle Cloud**
   - Ve a https://cloud.oracle.com/free
   - Regístrate (requiere tarjeta de crédito pero no te cobran)

2. **Crear VM**
   - Compute → Instances → Create Instance
   - Shape: VM.Standard.E2.1.Micro (Always Free)
   - Image: Ubuntu 22.04
   - Agrega tu llave SSH

3. **Configurar VM**
   ```bash
   # Conectarse por SSH
   ssh ubuntu@[IP-de-tu-VM]

   # Instalar Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu

   # Instalar Docker Compose
   sudo apt update
   sudo apt install docker-compose -y
   ```

4. **Subir tu proyecto**
   ```bash
   # En tu máquina local
   scp -r /Users/jdelaroca/PEEC ubuntu@[IP-VM]:~/qualittest

   # En la VM
   cd ~/qualittest
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Abrir puertos**
   - En Oracle Cloud Console:
     - Networking → Virtual Cloud Networks
     - Security Lists → Add Ingress Rules
     - Permitir puertos: 80, 443, 3000, 5001

---

## Mi Recomendación

Para tu caso, te recomiendo **Railway.app** por estas razones:

1. **Más fácil de configurar** (5-10 minutos)
2. **Gratis real** (no necesitas tarjeta de crédito)
3. **MySQL incluido** sin configuración adicional
4. **Despliegue automático** desde GitHub
5. **URL instantánea** sin necesidad de dominio

### Costo Estimado
- Railway: **$0/mes** (incluye $5 USD de crédito mensual, suficiente para tu app)
- Si excedes: ~$3-5 USD/mes

---

## Después del Despliegue

Una vez desplegado, podrás:

1. **Acceder desde cualquier lugar:**
   - Railway: `https://qualittest.up.railway.app`
   - Render: `https://qualittest-frontend.onrender.com`
   - Fly.io: `https://qualittest-frontend.fly.dev`

2. **Compartir el enlace** con quien necesites

3. **Monitorear** el uso y logs desde el dashboard

4. **Actualizar** haciendo push a GitHub (despliega automático)

---

## Próximos Pasos (Opcional)

Cuando quieras agregar un dominio personalizado:

1. Compra un dominio en Namecheap (~$10/año)
2. Configura los DNS apuntando a tu servicio
3. Agrega SSL gratis con Let's Encrypt (automático en todas las plataformas)

---

## ¿Necesitas Ayuda?

Si tienes problemas con el despliegue, avísame y te ayudo paso a paso con la plataforma que elijas.
