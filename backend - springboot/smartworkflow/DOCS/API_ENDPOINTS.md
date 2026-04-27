# 📘 SmartWORKFLOW — Documentación de Endpoints API

> **Base URL:** `http://localhost:8081/api`
> **Autenticación:** JWT via header `Authorization: Bearer <token>` + refresh via cookie HttpOnly
> **Última actualización:** Abril 2026 (Arquitectura Multi-Tenant)

---

## Leyenda de Roles

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | Administrador global del sistema (sin organización) |
| `ADMIN` | Administrador de una organización |
| `MANAGER` | Jefe de departamento |
| `OFFICER` | Funcionario/Empleado operativo |

> **Clientes/Ciudadanos** no tienen cuenta en el sistema. Acceden al tracking público con su código de trámite.

---

## 🔐 Auth — `/api/auth`

### `POST /api/auth/login`
**Descripción:** Autentica a un usuario y retorna un JWT + perfil. El `orgSlug` es opcional: si es `null`, busca un `SUPER_ADMIN` global.

**Roles:** Público (sin autenticación)

**Request Body:**
```json
{
  "email": "admin@cre.com",
  "password": "password123",
  "orgSlug": "cre"
}
```

> Para SUPER_ADMIN, omitir `orgSlug`:
```json
{
  "email": "superadmin@smartworkflow.app",
  "password": "admin2026!",
  "orgSlug": null
}
```

**Response (200 OK):**
- Header: `Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userProfile": {
    "id": "ee000000-0000-0000-0000-000000000001",
    "name": "Admin CRE",
    "role": "ADMIN",
    "departmentId": null,
    "orgSlug": "cre",
    "orgName": "Cooperativa Rural de Electrificación (CRE)"
  }
}
```

---

### `POST /api/auth/impersonate`
**Descripción:** Permite a SUPER_ADMIN o ADMIN iniciar sesión en nombre de otro usuario.

**Roles requeridos:** `SUPER_ADMIN`, `ADMIN`

**Request Body:**
```json
{
  "targetUserId": "ee000000-0000-0000-0000-000000000003"
}
```

**Response (200 OK):** Mismo formato que login.

---

### `POST /api/auth/refresh`
**Descripción:** Renueva el accessToken usando la cookie HttpOnly `refreshToken`.

**Roles:** Público (cookie HttpOnly)

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userProfile": { ... }
}
```

---

### `POST /api/auth/logout`
**Descripción:** Invalida la cookie de refresh token.

**Roles:** Público

**Response (200 OK):**
```json
{ "message": "Sesión cerrada correctamente" }
```

---

## 🏛️ Organizations — `/api/organizations` (SUPER_ADMIN)

### `GET /api/organizations`
**Descripción:** Lista todas las organizaciones registradas en el sistema.

**Roles requeridos:** `SUPER_ADMIN`

**Response (200 OK):**
```json
[
  {
    "id": "bb000000-0000-0000-0000-000000000001",
    "name": "Cooperativa Rural de Electrificación (CRE)",
    "slug": "cre",
    "logoUrl": null,
    "settings": { "theme": "blue", "locale": "es-BO" },
    "createdAt": "2026-04-27T15:40:00Z"
  }
]
```

---

### `GET /api/organizations/{orgId}`
**Descripción:** Obtiene los detalles de una organización por su ID.

**Roles requeridos:** `SUPER_ADMIN`

**Path Params:** `orgId` — UUID de la organización

---

### `POST /api/organizations`
**Descripción:** Crea una nueva organización. Opcionalmente, crea el primer usuario ADMIN de esa org.

**Roles requeridos:** `SUPER_ADMIN`

**Request Body:**
```json
{
  "name": "Empresa de Agua SA",
  "slug": "agua-sa",
  "logoUrl": "https://cdn.example.com/logos/agua.png",
  "adminName": "Director Agua",
  "adminEmail": "admin@agua-sa.com",
  "adminPassword": "securePass123"
}
```

**Response (200 OK):** Objeto `Organization` creado.

---

### `PUT /api/organizations/{orgId}`
**Descripción:** Actualiza nombre y/o logo de una organización.

**Roles requeridos:** `SUPER_ADMIN`

**Request Body:**
```json
{
  "name": "Empresa de Agua SA (Actualizada)",
  "logoUrl": "https://cdn.example.com/logos/agua-v2.png"
}
```

---

### `GET /api/organizations/{orgId}/users`
**Descripción:** Lista todos los usuarios de una organización específica.

**Roles requeridos:** `SUPER_ADMIN`

---

## 🧑‍💼 Clients — `/api/clients` (OFFICER/MANAGER/ADMIN)

### `GET /api/clients`
**Descripción:** Lista los clientes/ciudadanos de la organización del usuario autenticado. Soporta búsqueda por nombre.

**Roles requeridos:** `OFFICER`, `MANAGER`, `ADMIN`

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `search` | `String` | (Opcional) Filtrar por nombre (case-insensitive) |

**Response (200 OK):**
```json
[
  {
    "id": "cc000000-0000-0000-0000-000000000001",
    "name": "Juan Pérez López",
    "email": "juan.perez@email.com",
    "phone": "+591 70000001",
    "dni": "1234567",
    "createdAt": "2026-04-27T15:40:00Z"
  }
]
```

---

### `GET /api/clients/{clientId}`
**Descripción:** Obtiene un cliente por su ID (validado contra la org del usuario).

---

### `POST /api/clients`
**Descripción:** Registra un nuevo cliente en la organización del usuario autenticado.

**Request Body:**
```json
{
  "name": "María López",
  "email": "maria@email.com",
  "phone": "+591 70012345",
  "dni": "7654321"
}
```

---

### `PUT /api/clients/{clientId}`
**Descripción:** Actualiza los datos de un cliente existente.

**Request Body:** Mismo formato que POST (campos opcionales).

---

## 📋 Audit Logs — `/api/audit-logs` (SUPER_ADMIN/ADMIN)

### `GET /api/audit-logs/global`
**Descripción:** Retorna todos los logs de auditoría del sistema (paginado).

**Roles requeridos:** `SUPER_ADMIN`

**Query Params:** Paginación estándar Spring (`page`, `size`, `sort`)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "...",
      "action": "CREATE_ORG",
      "entityType": "ORGANIZATION",
      "entityId": "bb000000-...",
      "metadata": { "slug": "cre" },
      "createdAt": "2026-04-27T15:40:00Z"
    }
  ],
  "totalElements": 3,
  "totalPages": 1
}
```

---

### `GET /api/audit-logs/system`
**Descripción:** Solo logs de nivel sistema (sin organización asociada).

**Roles requeridos:** `SUPER_ADMIN`

---

### `GET /api/audit-logs/org/{orgId}`
**Descripción:** Logs de auditoría de una organización específica.

**Roles requeridos:** `SUPER_ADMIN` (cualquier org) o `ADMIN` (solo su propia org)

---

## 👥 Users — `/api/users`

### `GET /api/users`
**Descripción:** Retorna la lista de usuarios de la organización del usuario autenticado.

**Roles:** Autenticado (cualquier rol)

**Response (200 OK):**
```json
[
  {
    "id": "ee000000-0000-0000-0000-000000000001",
    "name": "Admin CRE",
    "email": "admin@cre.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-04-27T15:40:00Z"
  }
]
```

---

### `POST /api/users`
**Descripción:** Crea un nuevo usuario en la organización.

**Roles requeridos:** `ADMIN`

**Request Body:**
```json
{
  "name": "María García",
  "email": "maria@cre.com",
  "passwordHash": "hashed_password",
  "role": "OFFICER",
  "organization": { "id": "bb000000-..." },
  "department": { "id": "dd000000-..." }
}
```

---

### `PUT /api/users/{id}`
**Roles requeridos:** `ADMIN` — Actualiza nombre, rol y/o departamento.

### `DELETE /api/users/{id}`
**Roles requeridos:** `ADMIN` — Soft delete (status → `INACTIVE`).

### `GET /api/users/me`
**Roles:** Autenticado — Retorna perfil del usuario actual.

---

## 🏢 Departments — `/api/departments`

### `GET /api/departments`
Lista departamentos de la org del usuario. **Roles:** Autenticado.

### `POST /api/departments`
Crea departamento. **Roles:** `ADMIN`.

### `PUT /api/departments/{id}`
Actualiza departamento. **Roles:** `ADMIN`.

### `DELETE /api/departments/{id}`
Elimina departamento (hard delete). **Roles:** `ADMIN`.

### `GET /api/departments/{id}/members`
Lista miembros del departamento. **Roles:** Autenticado.

---

## 📋 Policies (Trámites) — `/api/policies`

### `GET /api/policies`
Lista políticas de la org. **Roles:** Autenticado.

### `POST /api/policies`
Crea política en estado `DRAFT`. **Roles:** `ADMIN`.

### `PUT /api/policies/{id}`
Actualiza nombre/descripción. **Roles:** `ADMIN`.

### `PUT /api/policies/{id}/publish`
Publica política (`DRAFT` → `ACTIVE`). **Roles:** `ADMIN`.

### `PUT /api/policies/{id}/deprecate`
Marca como `DEPRECATED`. **Roles:** `ADMIN`.

### `PUT /api/policies/{id}/diagram`
Guarda diagrama BPM (JSON). **Roles:** `ADMIN`.

### `POST /api/policies/{id}/validate`
Valida integridad del grafo. **Roles:** `ADMIN`.

---

## 📁 Cases (Trámites en Curso) — `/api/cases`

### `POST /api/cases`
**Descripción:** Inicia un nuevo caso/trámite asociado a un cliente y política.

**Roles:** Autenticado (`OFFICER`, `MANAGER`, `ADMIN`)

**Request Body:**
```json
{
  "policyId": "ff000000-0000-0000-0000-000000000001",
  "orgId": "bb000000-0000-0000-0000-000000000001",
  "clientId": "cc000000-0000-0000-0000-000000000001",
  "initialFormData": {
    "numeroCedula": "1234567",
    "tipoSolicitud": "Reclamo"
  }
}
```

**Response (200 OK):**
```json
{
  "trackingCode": "CRE-2026-A3F7"
}
```

---

### `GET /api/cases/track/{trackingCode}`
**Descripción:** Endpoint público para consultar estado de trámite.

**Roles:** Público (sin autenticación)

**Path Params:** `trackingCode` — código legible (ej. `CRE-2026-A3F7`)

**Response (200 OK):**
```json
{
  "trackingCode": "CRE-2026-A3F7",
  "caseStatus": "IN_PROGRESS",
  "startedAt": "2026-04-25T09:00:00Z",
  "progressPercentage": 50,
  "currentActivities": [
    {
      "activityName": "Recepción de Reclamo",
      "status": "PENDING",
      "departmentName": "Atención al Cliente"
    }
  ],
  "history": []
}
```

---

### `GET /api/cases/my-tasks`
Tareas asignadas al usuario. **Roles:** `OFFICER`, `MANAGER`.

### `GET /api/cases/department-tasks`
Tareas del departamento. **Roles:** `MANAGER`.

### `POST /api/cases/{caseId}/tokens/{tokenId}/complete`
Completa una actividad. **Roles:** `OFFICER`, `MANAGER`.

### `PUT /api/cases/{caseId}/tokens/{tokenId}/reassign`
Reasigna tarea. **Roles:** `MANAGER`.

---

## 🔔 Notifications — `/api/notifications`

### `GET /api/notifications`
Lista notificaciones del usuario. **Roles:** Autenticado. Header: `X-Unread-Count`.

### `PUT /api/notifications/{id}/read`
Marca una como leída. **Roles:** Autenticado.

### `PUT /api/notifications/read-all`
Marca todas como leídas. **Roles:** Autenticado.

### `DELETE /api/notifications/read-all`
Elimina notificaciones leídas. **Roles:** Autenticado.

---

## 📊 Analytics — `/api/analytics`

### `GET /api/analytics/bottlenecks`
Análisis de cuellos de botella. **Roles:** `ADMIN`, `MANAGER`.

### `GET /api/analytics/dashboard`
Dashboard global con métricas. **Roles:** `ADMIN`, `MANAGER`.

---

## 📝 Resumen de Endpoints

| Método | Endpoint | Descripción | Rol mínimo |
|--------|----------|-------------|------------|
| `POST` | `/api/auth/login` | Iniciar sesión (dual flow) | Público |
| `POST` | `/api/auth/impersonate` | Suplantar usuario | SUPER_ADMIN/ADMIN |
| `POST` | `/api/auth/refresh` | Renovar token | Público (cookie) |
| `POST` | `/api/auth/logout` | Cerrar sesión | Público |
| | | **Organizations** | |
| `GET` | `/api/organizations` | Listar organizaciones | SUPER_ADMIN |
| `GET` | `/api/organizations/{id}` | Detalle organización | SUPER_ADMIN |
| `POST` | `/api/organizations` | Crear org + admin | SUPER_ADMIN |
| `PUT` | `/api/organizations/{id}` | Actualizar org | SUPER_ADMIN |
| `GET` | `/api/organizations/{id}/users` | Usuarios de org | SUPER_ADMIN |
| | | **Clients** | |
| `GET` | `/api/clients` | Listar clientes (org) | OFFICER/MANAGER/ADMIN |
| `GET` | `/api/clients/{id}` | Detalle cliente | OFFICER/MANAGER/ADMIN |
| `POST` | `/api/clients` | Crear cliente | OFFICER/MANAGER/ADMIN |
| `PUT` | `/api/clients/{id}` | Actualizar cliente | OFFICER/MANAGER/ADMIN |
| | | **Audit Logs** | |
| `GET` | `/api/audit-logs/global` | Logs globales (paginado) | SUPER_ADMIN |
| `GET` | `/api/audit-logs/system` | Logs de sistema | SUPER_ADMIN |
| `GET` | `/api/audit-logs/org/{id}` | Logs por org | SUPER_ADMIN/ADMIN |
| | | **Users** | |
| `GET` | `/api/users` | Listar usuarios | Autenticado |
| `POST` | `/api/users` | Crear usuario | ADMIN |
| `PUT` | `/api/users/{id}` | Actualizar usuario | ADMIN |
| `DELETE` | `/api/users/{id}` | Desactivar usuario | ADMIN |
| `GET` | `/api/users/me` | Perfil propio | Autenticado |
| | | **Departments** | |
| `GET` | `/api/departments` | Listar departamentos | Autenticado |
| `POST` | `/api/departments` | Crear departamento | ADMIN |
| `PUT` | `/api/departments/{id}` | Actualizar departamento | ADMIN |
| `DELETE` | `/api/departments/{id}` | Eliminar departamento | ADMIN |
| `GET` | `/api/departments/{id}/members` | Miembros | Autenticado |
| | | **Policies** | |
| `GET` | `/api/policies` | Listar políticas | Autenticado |
| `POST` | `/api/policies` | Crear política | ADMIN |
| `PUT` | `/api/policies/{id}` | Actualizar política | ADMIN |
| `PUT` | `/api/policies/{id}/publish` | Publicar política | ADMIN |
| `PUT` | `/api/policies/{id}/deprecate` | Deprecar política | ADMIN |
| `PUT` | `/api/policies/{id}/diagram` | Guardar diagrama | ADMIN |
| `POST` | `/api/policies/{id}/validate` | Validar grafo | ADMIN |
| | | **Cases** | |
| `POST` | `/api/cases` | Iniciar trámite | OFFICER/MANAGER/ADMIN |
| `GET` | `/api/cases/track/{code}` | Consultar trámite | Público |
| `GET` | `/api/cases/my-tasks` | Mis tareas | OFFICER/MANAGER |
| `GET` | `/api/cases/department-tasks` | Tareas departamento | MANAGER |
| `POST` | `/api/cases/{caseId}/tokens/{tokenId}/complete` | Completar actividad | OFFICER/MANAGER |
| `PUT` | `/api/cases/{caseId}/tokens/{tokenId}/reassign` | Reasignar tarea | MANAGER |
| | | **Notifications** | |
| `GET` | `/api/notifications` | Listar notificaciones | Autenticado |
| `PUT` | `/api/notifications/{id}/read` | Marcar leída | Autenticado |
| `PUT` | `/api/notifications/read-all` | Marcar todas leídas | Autenticado |
| `DELETE` | `/api/notifications/read-all` | Borrar leídas | Autenticado |
| | | **Analytics** | |
| `GET` | `/api/analytics/bottlenecks` | Cuellos de botella | ADMIN/MANAGER |
| `GET` | `/api/analytics/dashboard` | Dashboard métricas | ADMIN/MANAGER |

---

## 🔑 Credenciales de Prueba (Seed Data)

| Usuario | Email | Password | Rol | Organización |
|---------|-------|----------|-----|--------------|
| Super Admin | `superadmin@smartworkflow.app` | `admin2026!` | SUPER_ADMIN | — (global) |
| Admin CRE | `admin@cre.com` | `password123` | ADMIN | CRE (`cre`) |
| Gerente RRHH | `manager@cre.com` | `password123` | MANAGER | CRE (`cre`) |
| Oficial Plataforma | `officer@cre.com` | `password123` | OFFICER | CRE (`cre`) |

---

> **Nota WebSocket:** Notificaciones en tiempo real via `ws://localhost:8081/ws` con topic `/user/queue/notifications`.
