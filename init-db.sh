#!/bin/bash

# QUALITTEST - Database Initialization Script
# Este script inicializa la base de datos en producción

echo "🔧 Inicializando base de datos QUALITTEST..."

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si se proporcionaron las credenciales
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Variables de entorno DB_HOST, DB_USER y DB_PASSWORD son requeridas${NC}"
    echo "Ejemplo de uso:"
    echo "  DB_HOST=your-db-host DB_USER=user DB_PASSWORD=pass ./init-db.sh"
    exit 1
fi

DB_NAME=${DB_NAME:-qualittest_system}

echo -e "${YELLOW}📊 Conectando a: $DB_HOST${NC}"
echo -e "${YELLOW}👤 Usuario: $DB_USER${NC}"
echo -e "${YELLOW}💾 Base de datos: $DB_NAME${NC}"
echo ""

# Verificar si mysql client está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ Error: MySQL client no está instalado${NC}"
    echo "Instala con: brew install mysql-client (macOS) o apt install mysql-client (Linux)"
    exit 1
fi

# Ejecutar schema.sql
echo "📝 Ejecutando schema.sql..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < server/config/schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos inicializada correctamente${NC}"
    echo ""
    echo "🎉 ¡Listo! Puedes iniciar sesión con:"
    echo "   Usuario: admin"
    echo "   Contraseña: password"
else
    echo -e "${RED}❌ Error al inicializar la base de datos${NC}"
    exit 1
fi
