# SmartWORKFLOW — Arquitectura Multi-Tenant
> Documento histórico aprobado · 2026-04-27

---

## 1. Modelo de Actores

```
┌─────────────────────────────────────────────────────────┐
│  SUPER_ADMIN  (sin org, nivel sistema)                  │
│  → Login en: smartworkflow.app/login                    │
│  → Crea organizaciones                                  │
│  → Crea el primer ADMIN de cada org                     │
│  → Ve métricas globales y bitácoras del sistema         │
│  → NO puede impersonar usuarios                         │
└───────────────────────┬─────────────────────────────────┘
                        │ crea orgs y sus primeros admins
┌───────────────────────▼─────────────────────────────────┐
│  ADMIN  (scoped a su organización)                      │
│  → Login en: {slug}.smartworkflow.app/login             │
│  → Crea MANAGERS y OFFICERS dentro de su org            │
│  → Crea/gestiona departamentos                          │
│  → Crea/activa políticas BPM                            │
│  → Ve métricas de su organización                       │
└───────────────────────┬─────────────────────────────────┘
                        │ gestiona
┌───────────────────────▼─────────────────────────────────┐
│  MANAGER  (scoped a su departamento)                    │
│  → Login en: {slug}.smartworkflow.app/login             │
│  → Supervisa flujos activos de su departamento          │
│  → Aprueba/rechaza gateways XOR                         │
│  → Puede crear perfiles de CLIENTES y asignar casos     │
└───────────────────────┬─────────────────────────────────┘
                        │ ejecuta
┌───────────────────────▼─────────────────────────────────┐
│  OFFICER  (scoped a su departamento)                    │
│  → Login en: {slug}.smartworkflow.app/login             │
│  → Ejecuta tareas de su bandeja                         │
│  → Crea perfiles de CLIENTES y asigna trámites          │
│  → Genera códigos de seguimiento para el cliente        │
└───────────────────────┬─────────────────────────────────┘
                        │ sirve a
┌───────────────────────▼─────────────────────────────────┐
│  CLIENTE  (sin login, acceso público)                   │
│  → Accede a: {slug}.smartworkflow.app/track             │
│  → Ingresa su código de trámite                         │
│  → Ve el estado actual de su caso en el flujo           │
│  → Su perfil es creado por un OFFICER/MANAGER           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Estrategia Multi-Tenant (Subdominios)

### Producción
Cada organización tiene su propio subdominio:
```
smartworkflow.app          → SUPER_ADMIN login / landing
cre.smartworkflow.app      → Login y track de CRE
hospital.smartworkflow.app → Login y track del Hospital
```

El **backend** resuelve el tenant a partir del header `Host` de la petición HTTP.

### Desarrollo (localhost)
Los subdominios reales no funcionan en localhost, por lo que el frontend usará un **query param `?tenant=`** como fallback:
```
localhost:4200                     → Super Admin login
localhost:4200?tenant=cre          → Login de CRE
localhost:4200/track?tenant=cre    → Track público de CRE
```

El frontend lee `window.location.hostname` en prod y `?tenant=` en dev para enviar el `orgSlug` al backend.

---

## 3. Flujo de Login por Rol

### SUPER_ADMIN
```
POST /api/auth/login
Body: { email: "superadmin@smartworkflow.app", password: "..." }
      (sin orgSlug)

Backend:
  1. Detecta ausencia de orgSlug → busca SUPER_ADMIN por email
  2. Valida contraseña
  3. Devuelve JWT con { role: SUPER_ADMIN, orgId: null, orgSlug: null, deptId: null }

Frontend: redirige a /super-admin/dashboard
```

### ADMIN / MANAGER / OFFICER
```
POST /api/auth/login
Body: { email: "admin@cre.com", password: "...", orgSlug: "cre" }

Backend:
  1. Busca organización por slug
  2. Busca usuario dentro de esa org por email
  3. Valida contraseña y status ACTIVE
  4. Devuelve JWT con { role, orgId, orgSlug, deptId }

Frontend: redirige según role → /admin | /manager | /officer
```

---

## 4. Modelo de Base de Datos

### Tabla `organizations`
```sql
CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,   -- usado en subdominio
  logo_url   VARCHAR(512),
  settings   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `users` (org_id nullable para SUPER_ADMIN)
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),   -- NULL para SUPER_ADMIN
  department_id UUID REFERENCES departments(id),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) CHECK (role IN ('SUPER_ADMIN','ADMIN','MANAGER','OFFICER')) NOT NULL,
  avatar_url    VARCHAR(512),
  status        VARCHAR(20) DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, org_id)
);
```

### Tabla `clients` (perfiles creados por officers)
```sql
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  phone       VARCHAR(50),
  dni         VARCHAR(50),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `cases` (con tracking_code y client_id)
```sql
-- tracking_code: código alfanumérico que el cliente usa en /track
-- client_id: FK al perfil del cliente
ALTER TABLE cases ADD COLUMN client_id UUID REFERENCES clients(id);
ALTER TABLE cases ADD COLUMN tracking_code VARCHAR(12) UNIQUE;
```

### Tabla `audit_logs` (bitácora del sistema)
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),  -- null = acción de sistema
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Estructura JWT (Claims)

```json
{
  "sub":     "uuid-del-usuario",
  "role":    "SUPER_ADMIN | ADMIN | MANAGER | OFFICER",
  "orgId":   "uuid-de-la-org | null",
  "orgSlug": "cre | null",
  "deptId":  "uuid-del-dept | null",
  "iat": 1234567890,
  "exp": 1234568790
}
```

> `orgSlug` en el JWT evita JOINs a organizations en cada request protegido.

---

## 6. Mapa de Rutas Frontend

| URL | Acceso | Descripción |
|-----|--------|-------------|
| `/` | Público | Landing / detección de tenant |
| `/login` | Público | Login universal (detecta tenant por subdominio o `?tenant=`) |
| `/track` | Público | Ingreso de código de trámite |
| `/track/:code` | Público | Estado del trámite |
| `/super-admin` | SUPER_ADMIN | Dashboard global del sistema |
| `/super-admin/organizations` | SUPER_ADMIN | CRUD de organizaciones |
| `/super-admin/logs` | SUPER_ADMIN | Bitácoras del sistema |
| `/admin` | ADMIN | Dashboard org |
| `/admin/users` | ADMIN | Gestión de usuarios |
| `/admin/departments` | ADMIN | Gestión de departamentos |
| `/admin/policies` | ADMIN | Editor de políticas BPM |
| `/manager` | MANAGER | Dashboard departamento |
| `/manager/cases` | MANAGER | Casos activos del dept |
| `/officer` | OFFICER | Bandeja de tareas |
| `/officer/clients` | OFFICER | Registro de clientes y trámites |

---

## 7. TenantService Angular (lógica de detección)

```typescript
export class TenantService {
  getSlug(): string | null {
    const hostname = window.location.hostname;
    // Producción: slug.smartworkflow.app
    if (hostname.endsWith('.smartworkflow.app')) {
      return hostname.split('.')[0];
    }
    // Desarrollo: ?tenant=cre
    return new URLSearchParams(window.location.search).get('tenant');
  }

  isSuperAdminContext(): boolean {
    return this.getSlug() === null;
  }
}
```

---

## 8. Seed Data de Referencia

| Email | Password | Rol | Org |
|-------|----------|-----|-----|
| `superadmin@smartworkflow.app` | `admin2026!` | SUPER_ADMIN | — |
| `admin@cre.com` | `password123` | ADMIN | CRE |
| `manager@cre.com` | `password123` | MANAGER | CRE |
| `officer@cre.com` | `password123` | OFFICER | CRE |

---

*Aprobado: 2026-04-27 · Implementación iniciada inmediatamente después.*
