# Despliegue Rápido en Railway.app

Esta es la forma más rápida y fácil de poner QUALITTEST en producción (5-10 minutos).

## ¿Por qué Railway?

- ✅ **Gratis**: $5 USD de crédito mensual (suficiente para tu app)
- ✅ **Fácil**: Despliegue con 3 clicks
- ✅ **Rápido**: Tu app estará online en minutos
- ✅ **Sin tarjeta**: No necesitas tarjeta de crédito
- ✅ **MySQL incluido**: Base de datos lista para usar

## Paso 1: Preparar tu Código

Asegúrate de que tu código esté en GitHub:

```bash
cd /Users/jdelaroca/PEEC

# Inicializar git si no lo has hecho
git init
git add .
git commit -m "Initial commit - QUALITTEST system"

# Crear repositorio en GitHub y conectar
# Ve a github.com → New repository → qualittest
git remote add origin https://github.com/TU_USUARIO/qualittest.git
git branch -M main
git push -u origin main
```

## Paso 2: Crear Cuenta en Railway

1. Ve a https://railway.app
2. Click en **"Start a New Project"**
3. Inicia sesión con GitHub (autoriza el acceso)

## Paso 3: Crear Base de Datos MySQL

1. En Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"MySQL"**
3. Railway creará la base de datos automáticamente
4. Espera 30 segundos hasta que esté lista (verá un check verde)

## Paso 4: Desplegar el Backend

1. Click en **"+ New"** otra vez
2. Selecciona **"GitHub Repo"**
3. Busca y selecciona tu repositorio `qualittest`
4. Railway detectará el Dockerfile y comenzará a construir

### Configurar Variables de Entorno del Backend

1. Click en tu servicio backend
2. Ve a la pestaña **"Variables"**
3. Agrega estas variables (click en **"+ New Variable"** para cada una):

```
NODE_ENV=production
PORT=5000
JWT_SECRET=cambiar_por_secreto_seguro_random_aqui
JWT_EXPIRE=7d
```

4. Ahora conecta a MySQL (Railway hace esto automático):
   - Click en **"+ New Variable"**
   - Selecciona **"Add Reference"**
   - Selecciona tu base de datos MySQL
   - Agrega estas referencias:
     ```
     DB_HOST → MYSQLHOST
     DB_USER → MYSQLUSER
     DB_PASSWORD → MYSQLPASSWORD
     DB_NAME → MYSQLDATABASE
     DB_PORT → MYSQLPORT
     ```

5. Click en **"Deploy"** (arriba a la derecha)

## Paso 5: Obtener URL del Backend

1. En tu servicio backend, ve a **"Settings"**
2. Scroll hasta **"Networking"**
3. Click en **"Generate Domain"**
4. Copia la URL (ejemplo: `qualittest-backend-production.up.railway.app`)

## Paso 6: Desplegar el Frontend

1. Click en **"+ New"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio
3. En **"Root Directory"**, escribe: `client`
4. Railway detectará que es una app React

### Configurar Variables del Frontend

1. Ve a **"Variables"**
2. Agrega esta variable:
```
REACT_APP_API_URL=https://TU-BACKEND-URL.up.railway.app/api
```
(Reemplaza con la URL del paso 5)

3. Click en **"Deploy"**

## Paso 7: Generar URL del Frontend

1. En el servicio frontend, ve a **"Settings"**
2. En **"Networking"**, click **"Generate Domain"**
3. Copia la URL (ejemplo: `qualittest.up.railway.app`)

## Paso 8: Inicializar Base de Datos

Necesitas ejecutar el schema.sql una vez:

### Opción A: Usando Railway CLI (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Conectar a MySQL
railway connect mysql

# Dentro de MySQL, pega el contenido de server/config/schema.sql
```

### Opción B: Usando MySQL Workbench o TablePlus

1. Descarga MySQL Workbench o TablePlus
2. Conecta usando las credenciales de Railway:
   - En Railway → MySQL service → Variables
   - Copia: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
3. Ejecuta el archivo `server/config/schema.sql`

### Opción C: Script desde tu computadora

```bash
# En tu proyecto local
DB_HOST=tu-mysql-host.railway.app \
DB_USER=root \
DB_PASSWORD=tu-password \
./init-db.sh
```

## Paso 9: ¡Probar tu App!

1. Ve a la URL de tu frontend (del Paso 7)
2. Deberías ver la página de login de QUALITTEST
3. Inicia sesión con:
   - **Usuario**: `admin`
   - **Password**: `password`

## 🎉 ¡Listo!

Tu aplicación QUALITTEST está ahora en producción y accesible desde cualquier lugar del mundo.

---

## Actualizaciones Futuras

Para actualizar tu app:

```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción de cambios"
git push

# Railway desplegará automáticamente
```

---

## Monitoreo

En Railway puedes:

- Ver logs en tiempo real
- Monitorear uso de CPU y memoria
- Ver métricas de la base de datos
- Configurar alertas

---

## Costos

Con el plan gratuito de Railway:

- **Crédito mensual**: $5 USD
- **Uso estimado**: $2-3 USD/mes
- **Sobran**: ~$2 USD de margen

Si tu app crece mucho, Railway te avisará antes de cobrarte.

---

## Solución de Problemas

### El backend no se conecta a MySQL

1. Verifica que las variables de entorno estén bien referenciadas
2. Asegúrate de que el servicio MySQL esté "healthy" (check verde)
3. Revisa los logs del backend: Railway → Backend → Logs

### El frontend no carga

1. Verifica que `REACT_APP_API_URL` apunte a tu backend
2. Asegúrate de incluir `https://` en la URL
3. No olvides `/api` al final

### Error "Cannot connect to database"

1. Espera 1-2 minutos después del primer deploy
2. MySQL puede tardar en inicializar
3. Reinicia el servicio backend

---

## ¿Necesitas Ayuda?

Si tienes problemas, puedes:

1. Revisar los logs en Railway (muy útiles)
2. Preguntar en Railway Discord: https://discord.gg/railway
3. Avisarme y te ayudo

---

## Próximos Pasos (Opcional)

1. **Dominio personalizado**: En Railway → Settings → Custom Domain
2. **Variables de producción**: Cambia JWT_SECRET por algo más seguro
3. **Backups**: Railway hace backups automáticos de MySQL
4. **Monitoreo**: Configura alertas en Railway

¡Disfruta tu app en producción! 🚀
