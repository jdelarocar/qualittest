# Plan de Implementación - Nuevas Funcionalidades QUALITTEST

## Resumen Ejecutivo

Este documento describe la implementación de las nuevas funcionalidades solicitadas para el sistema QUALITTEST, incluyendo:
- Sistema de solicitudes de registro
- Gestión de opciones de participación
- Módulo de proveedores
- Sistema de facturación (FEL Guatemala)
- Módulo de mantenimiento

---

## 1. MÓDULO DE REGISTRO Y SOLICITUDES

### 1.1 Página de Solicitud de Registro (Pública)

**Ubicación**: `/register-request`

**Campos del Formulario**:

#### Sección 1: Datos del Laboratorio
- Nombre del laboratorio *
- Correo electrónico *
- Dirección *
- País (select, default: Guatemala) *
- Departamento *
- Teléfono *
- Opción de participación (select dinámico) *
- Forma de pago (radio buttons): *
  - Anual
  - Dos cuotas
  - Tres cuotas
  - Seis cuotas

#### Sección 2: Datos del Químico Biólogo
- Nombre completo *
- Correo electrónico *
- Celular *
- Número de colegiado *

#### Sección 3: Datos de Contacto
- Nombre del responsable *
- Correo electrónico *
- Teléfono *

#### Sección 4: Datos de Facturación
- Nombre (razón social) *
- NIT *
- Dirección fiscal *

**Validaciones**:
- Emails con formato válido
- Teléfonos con formato guatemalteco
- NIT con formato válido (ej: 12345678-9 o CF)
- Todos los campos marcados con * son obligatorios

**Flujo**:
1. Usuario completa formulario
2. Sistema valida datos
3. Se crea registro en `registration_requests` con status='pending'
4. Se envía email de confirmación al solicitante
5. Se notifica a administradores

### 1.2 Módulo de Administración de Solicitudes

**Ubicación**: `/admin/requests`

**Vista Lista**:
- Tabla con todas las solicitudes
- Filtros: Pendientes / Aprobadas / Rechazadas
- Búsqueda por nombre de laboratorio
- Columnas:
  - ID
  - Nombre del laboratorio
  - Correo electrónico
  - Opción de participación
  - Fecha de solicitud
  - Estado
  - Acciones

**Vista Detalle**:
- Muestra toda la información ingresada organizada por secciones
- Botones:
  - **Aprobar**: Abre modal para confirmar
  - **Rechazar**: Abre modal para ingresar razón de rechazo

**Flujo de Aprobación**:
1. Admin revisa solicitud
2. Click en "Aprobar"
3. Sistema:
   - Genera código único de laboratorio (formato: LAB-0001)
   - Genera contraseña temporal
   - Crea registro en tabla `laboratories`
   - Crea usuario en tabla `users` con rol='laboratory'
   - Actualiza solicitud a status='approved'
   - Envía email al laboratorio con credenciales
4. Solicitud desaparece de "Pendientes"

**Flujo de Rechazo**:
1. Admin click en "Rechazar"
2. Ingresa razón del rechazo
3. Sistema:
   - Actualiza solicitud a status='rejected'
   - Guarda razón de rechazo
   - Envía email al solicitante
4. Solicitud se mueve a "Rechazadas"

---

## 2. OPCIONES DE PARTICIPACIÓN

### 2.1 Gestión de Opciones

**Ubicación**: `/admin/participation-options`

**Funcionalidades**:
- CRUD completo (Crear, Leer, Actualizar, Eliminar)
- Lista con filtros y búsqueda
- Activar/Desactivar opciones

**Campos**:
- Nombre *
- Precio (formato: Q 1,500.00) *
- Tipo *:
  - Abierto: Cualquier laboratorio puede inscribirse
  - Cerrado: Requiere invitación/aprobación especial
- Programas incluidos * (selección múltiple):
  - Bioquímica
  - Hematología
  - Inmunología
  - Microbiología
  - Etc.
- Descripción
- Estado: Activo/Inactivo

**Validaciones**:
- Precio debe ser mayor a 0
- Al menos un programa debe estar seleccionado
- No se puede eliminar opción si tiene laboratorios activos asignados

---

## 3. MÓDULO DE LABORATORIOS (Mejorado)

### 3.1 Lista de Laboratorios

**Ubicación**: `/admin/laboratories`

**Funcionalidades Nuevas**:
- Filtros:
  - Por código
  - Por nombre
  - Por estatus (Activo/Inactivo)
  - Por opción de participación
- Búsqueda en tiempo real
- Botón "Descargar a Excel"
- Paginación
- Ordenamiento por columnas

**Columnas**:
- Código
- Nombre
- Email
- Teléfono
- Opción de participación
- Forma de pago
- Estado
- Fecha de registro
- Acciones

**Gestión de Estado**:
- Toggle Activo/Inactivo
- Confirmación antes de cambiar
- Log de cambios de estado

### 3.2 Crear/Editar Laboratorio

**Funcionalidad**:
- Formulario completo con todas las secciones
- Sin necesidad de solicitud previa
- Generación automática de código
- Asignación de contraseña inicial

---

## 4. MÓDULO DE PROVEEDORES

### 4.1 Gestión de Proveedores

**Ubicación**: `/admin/providers`

**Funcionalidades**:
- CRUD completo
- Lista con búsqueda y filtros
- Exportar a Excel

**Campos**:
- ID (auto-generado)
- Nombre del proveedor *
- Teléfono *
- Nombre del contacto *
- Teléfono del contacto *
- Email
- Dirección
- Estado: Activo/Inactivo

**Vista**:
- Tabla ordenable
- Botones: Crear, Editar, Eliminar
- Confirmación antes de eliminar

---

## 5. MÓDULO DE FACTURACIÓN (FEL Guatemala)

### 5.1 Gestión de Facturas

**Ubicación**: `/admin/invoicing`

**Funcionalidades**:
- Crear facturas manuales o automáticas
- Integración con FEL de SAT Guatemala
- Envío de facturas por email
- Descarga de PDF certificado
- Seguimiento de pagos

**Campos de Factura**:
- Número de factura (auto)
- Laboratorio *
- Fecha de emisión *
- Fecha de vencimiento *
- Datos de facturación (tomados del laboratorio)
- Ítems:
  - Descripción
  - Cantidad
  - Precio unitario
  - Subtotal
- Subtotal
- IVA (12%)
- Total
- Estado: Borrador / Emitida / Pagada / Cancelada

**Integración FEL**:
1. Admin crea/edita factura
2. Click en "Certificar con FEL"
3. Sistema:
   - Genera XML según especificaciones SAT
   - Envía a API de FEL
   - Recibe UUID y número de autorización
   - Descarga PDF certificado
   - Guarda en base de datos
4. Factura queda certificada

**APIs FEL Compatibles**:
- INFILE
- DIGIFACT
- G4S
- Cualquier proveedor certificado FEL

**Flujo de Pago**:
- Marcar como pagada manualmente
- Registrar fecha de pago
- Generar recibo

---

## 6. MÓDULO DE MANTENIMIENTO

### 6.1 Gestión de Usuarios

**Ubicación**: `/admin/maintenance/users`

**Funcionalidades**:
- Ver todos los usuarios del sistema
- Filtrar por rol: Admin / Laboratorio / Coordinador
- Crear nuevos usuarios
- Editar permisos y datos
- Resetear contraseñas
- Desactivar usuarios

**Campos**:
- Usuario *
- Contraseña (hash)
- Nombre completo *
- Email *
- Rol *
- Laboratorio asociado (si aplica)
- Permisos especiales:
  - Aprobar solicitudes
  - Gestionar facturación
  - Gestionar proveedores
- Estado: Activo/Inactivo
- Último acceso

### 6.2 Ficha Completa de Laboratorio

**Funcionalidad**:
- Admin puede crear laboratorio completo sin solicitud
- Todos los campos del formulario de solicitud
- Generación automática de credenciales
- Envío de email con información de acceso

---

## 7. ESTRUCTURA TÉCNICA

### 7.1 Backend (Node.js)

**Nuevas Rutas API**:

```
POST   /api/register-request          - Crear solicitud
GET    /api/admin/requests             - Listar solicitudes
GET    /api/admin/requests/:id         - Ver detalle
PUT    /api/admin/requests/:id/approve - Aprobar solicitud
PUT    /api/admin/requests/:id/reject  - Rechazar solicitud

GET    /api/admin/participation-options      - Listar opciones
POST   /api/admin/participation-options      - Crear opción
PUT    /api/admin/participation-options/:id  - Actualizar opción
DELETE /api/admin/participation-options/:id  - Eliminar opción

GET    /api/admin/providers           - Listar proveedores
POST   /api/admin/providers           - Crear proveedor
PUT    /api/admin/providers/:id       - Actualizar proveedor
DELETE /api/admin/providers/:id       - Eliminar proveedor

GET    /api/admin/invoices            - Listar facturas
POST   /api/admin/invoices            - Crear factura
PUT    /api/admin/invoices/:id        - Actualizar factura
POST   /api/admin/invoices/:id/certify - Certificar con FEL
GET    /api/admin/invoices/:id/pdf    - Descargar PDF

GET    /api/admin/laboratories/export - Exportar Excel
```

### 7.2 Frontend (React)

**Nuevos Componentes**:

```
src/components/
├── public/
│   └── RegistrationRequest.js      - Formulario público de solicitud
├── admin/
│   ├── Requests/
│   │   ├── RequestsList.js         - Lista de solicitudes
│   │   ├── RequestDetail.js        - Detalle de solicitud
│   │   └── ApprovalModal.js        - Modal de aprobación/rechazo
│   ├── ParticipationOptions/
│   │   ├── OptionsList.js          - Lista de opciones
│   │   └── OptionForm.js           - Formulario crear/editar
│   ├── Providers/
│   │   ├── ProvidersList.js        - Lista de proveedores
│   │   └── ProviderForm.js         - Formulario crear/editar
│   ├── Invoicing/
│   │   ├── InvoicesList.js         - Lista de facturas
│   │   ├── InvoiceForm.js          - Crear/editar factura
│   │   └── FELCertification.js     - Modal certificación FEL
│   └── Maintenance/
│       ├── UsersList.js            - Gestión de usuarios
│       └── UserForm.js             - Crear/editar usuarios
```

---

## 8. PRIORIZACIÓN Y FASES

### Fase 1 (Crítico - 2 semanas)
1. ✅ Sistema de solicitudes de registro
2. ✅ Módulo de aprobación de solicitudes
3. ✅ Gestión de opciones de participación
4. ✅ Mejoras en módulo de laboratorios

### Fase 2 (Importante - 1 semana)
5. ✅ Módulo de proveedores
6. ✅ Módulo de mantenimiento/usuarios

### Fase 3 (Complejo - 2-3 semanas)
7. ✅ Módulo de facturación básico
8. ✅ Integración con FEL de SAT

---

## 9. CONSIDERACIONES TÉCNICAS

### 9.1 Seguridad
- Validación de datos en frontend y backend
- Sanitización de inputs
- Protección contra SQL injection
- Permisos basados en roles
- Logs de auditoría

### 9.2 Notificaciones por Email
- Confirmación de solicitud al solicitante
- Notificación a admins de nueva solicitud
- Credenciales al aprobar laboratorio
- Notificación de rechazo
- Envío de facturas certificadas

### 9.3 Generación de Códigos
- Laboratorios: LAB-0001, LAB-0002, etc.
- Facturas: FAC-2024-0001
- Contraseñas temporales: Aleatorias seguras (8 caracteres)

### 9.4 Exportación Excel
- Usar librería `xlsx` o `exceljs`
- Incluir todos los campos relevantes
- Formato profesional
- Nombre de archivo con fecha

---

## 10. PRÓXIMOS PASOS

¿Quieres que comience con la implementación?

**Opción A**: Implementar todo de una vez (3-4 semanas)
**Opción B**: Implementar por fases (empezar con Fase 1)
**Opción C**: Implementar módulos específicos que más necesites

**Dime cuál prefieres y comenzamos** 🚀
