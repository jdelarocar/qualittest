# 🚀 Guía de Inicio Rápido - PEEC System

## 🐳 Instalación con Docker (Más Rápido)

### Opción 1: Docker (Recomendado - 2 Minutos)

```bash
# 1. Asegúrate de tener Docker Desktop corriendo

# 2. Inicia todos los servicios
docker-compose up -d

# O usa el script de inicio
./start-docker.sh

# 3. ¡Listo! Accede a:
# Frontend: http://localhost:3000
# Usuario: admin
# Contraseña: admin123
```

**Comandos útiles:**
```bash
# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Reiniciar
docker-compose restart

# Conectar a MySQL
docker exec -it peec-mysql mysql -u peec_user -ppeec_password peec_system
```

---

## 💻 Instalación Manual (Sin Docker)

### Opción 2: Instalación Tradicional (5 Minutos)

### 1. Configurar MySQL

```bash
# Crear base de datos
mysql -u root -p

# En MySQL shell:
source server/config/schema.sql
exit
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

Configuración mínima:
```env
DB_PASSWORD=tu_password_mysql
JWT_SECRET=una_clave_secreta_aleatoria
```

### 3. Instalar y Ejecutar

```bash
# Instalar todas las dependencias
npm run install-all

# Iniciar aplicación (backend + frontend)
npm run dev
```

### 4. Acceder

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `admin123`

## 🎯 Primeros Pasos

### Como Laboratorio Participante:

1. **Login** → Ingresar con su código y contraseña
2. **Dashboard** → Ver envíos abiertos y estado
3. **Configuración** → Configurar parámetros de medición
4. **Envío de Resultados** → Ingresar valores de muestras
5. **Estadísticas** → Ver desempeño y gráficas

## 📊 Programas Disponibles

- **Bioquímica**: 39 analitos (Glucosa, Colesterol, etc.)
- **Hematología**: Hemoglobina, fórmula diferencial
- **Uroanálisis**: Análisis químico de orina
- **Parasitología**: Identificación de parásitos
- **Bacteriología**: Identificación bacteriológica
- **Tuberculosis**: Tinción Ziehl Neelsen
- **Micología**: Estructuras fúngicas
- **Inmunología**: Pruebas serológicas

## 🔧 Solución de Problemas

### Error de conexión a MySQL
```bash
# Verificar que MySQL está corriendo
mysql --version
mysql -u root -p -e "SHOW DATABASES;"
```

### Error de puerto ocupado
```bash
# Cambiar puerto en .env
PORT=5001  # en lugar de 5000
```

### Dependencias no instaladas
```bash
# Reinstalar dependencias
rm -rf node_modules client/node_modules
npm run install-all
```

## 📞 Ayuda

¿Problemas? Contacte:
- Email: peec@aqbg.org
- Tel: 2448-2502
