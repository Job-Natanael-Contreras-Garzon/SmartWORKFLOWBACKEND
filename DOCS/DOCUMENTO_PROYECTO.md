# SmartWORKFLOW — Documento de Proyecto
> Ingeniería de Software I · Primer Parcial · 2026

---

## 📋 FLUJO DE TRABAJO DE CAPTURA DE REQUISITOS

---

### 1. Alcance del Proyecto

- **SmartWORKFLOW** es una plataforma web de gestión de **políticas de negocio (BPM – Business Process Management)** orientada a organizaciones públicas y privadas.
- Permite **diseñar visualmente** los flujos de trabajo de cada proceso institucional (trámites) mediante un editor de diagramas de actividad.
- Implementa un **motor de flujo (Case Engine)** que guía cada trámite a través de los departamentos definidos en la política, de forma automática.
- Cada funcionario tiene una **bandeja de tareas personalizada** con indicadores visuales de estado (nuevo, en progreso, completado).
- Los clientes/ciudadanos pueden **rastrear el estado de su trámite en tiempo real** mediante un código único, sin necesidad de crear cuenta.
- Detecta automáticamente **cuellos de botella** en los procesos mediante análisis de SLA (Service Level Agreement).
- Genera **notificaciones** en tiempo real (WebSocket) y por correo electrónico en cada cambio de estado.
- Arquitectura **multi-tenant**: cada organización tiene su propio subdominio y datos completamente aislados.
- La plataforma es extensible para incorporar **asistencia con IA** (voz, análisis predictivo, recomendaciones de optimización).

---

### 2. Objetivos Específicos

1. Desarrollar un **editor visual BPM** basado en notación de diagramas de actividad, que permita al administrador definir flujos secuenciales, alternativos, interactivos y de procesos paralelos.
2. Implementar un **motor de ejecución de casos** que gestione el avance de cada trámite a través de las actividades y departamentos según la política definida.
3. Proveer a cada **funcionario** un panel de trabajo con su bandeja de tareas, formularios dinámicos por actividad y etiquetas visuales de estado (rojo/amarillo/verde).
4. Permitir al **cliente/ciudadano** consultar el estado de su trámite en tiempo real mediante un código de seguimiento, sin requerir autenticación.
5. Implementar un sistema de **notificaciones en tiempo real** (WebSocket + correo electrónico) para todos los actores involucrados.
6. Detectar y reportar **cuellos de botella** mediante el monitoreo de SLA por actividad y departamento.
7. Implementar un **sistema multi-tenant** con subdominios por organización y aislamiento total de datos.
8. Integrar la generación de **QR y PDF** para que el cliente pueda descargar su comprobante al finalizar un trámite.

---

### 3. Requisitos Funcionales

| ID | Requisito Funcional |
|----|---------------------|
| RF-01 | El **SUPER_ADMIN** puede crear, editar y eliminar organizaciones. |
| RF-02 | El **SUPER_ADMIN** puede crear el primer ADMIN de cada organización. |
| RF-03 | El **SUPER_ADMIN** puede visualizar bitácoras globales de auditoría. |
| RF-04 | El **ADMIN** puede gestionar usuarios (MANAGER, OFFICER) dentro de su organización. |
| RF-05 | El **ADMIN** puede crear y gestionar departamentos. |
| RF-06 | El **ADMIN** puede diseñar, activar y archivar políticas BPM mediante el editor visual. |
| RF-07 | El editor BPM soporta actividades tipo: `TASK`, `GATEWAY_XOR` (flujo alternativo), `GATEWAY_AND` (flujo paralelo) y `EVENT`. |
| RF-08 | El **MANAGER** puede supervisar los flujos activos de su departamento. |
| RF-09 | El **MANAGER** puede aprobar o rechazar gateways XOR. |
| RF-10 | El **OFFICER** recibe una bandeja de tareas con las actividades pendientes asignadas a su departamento. |
| RF-11 | El **OFFICER** puede crear perfiles de clientes y abrir nuevos trámites. |
| RF-12 | El **OFFICER** completa los formularios dinámicos de cada actividad para avanzar el trámite. |
| RF-13 | El **CLIENTE** puede consultar el estado de su trámite ingresando un código de seguimiento (sin login). |
| RF-14 | El sistema genera un **código de seguimiento único** (ej. `CRE-2026-A3F7`) por cada trámite. |
| RF-15 | El sistema notifica por **correo electrónico y WebSocket** en los eventos: inicio, avance, rechazo, completado y violación de SLA. |
| RF-16 | El sistema identifica automáticamente **cuellos de botella** mediante el análisis de tiempos por actividad. |
| RF-17 | El panel de funcionario muestra tareas con **etiquetas de color**: rojo (nueva), amarillo (en progreso), verde (completada). |
| RF-18 | Al finalizar un trámite, el cliente puede descargar un **comprobante en PDF** con código QR. |
| RF-19 | El **ADMIN** puede ver métricas y analíticas de su organización (throughput por departamento, tiempos promedio). |
| RF-20 | El sistema implementa **control de acceso por rol** (SUPER_ADMIN, ADMIN, MANAGER, OFFICER). |

---

### 4. Requisitos No Funcionales

| ID | Requisito No Funcional |
|----|------------------------|
| RNF-01 | **Seguridad**: Autenticación mediante JWT con expiración configurable; contraseñas almacenadas con hash BCrypt. |
| RNF-02 | **Multi-tenancy**: Datos de cada organización completamente aislados; acceso por subdominio o parámetro `?tenant=`. |
| RNF-03 | **Rendimiento**: Índices en las columnas de búsqueda crítica (tracking_code, email+org, tokens por caso). |
| RNF-04 | **Disponibilidad**: Arquitectura stateless en el backend permite escalado horizontal. |
| RNF-05 | **Rate Limiting**: Control de tasa de peticiones mediante Bucket4j para prevenir abuso del API. |
| RNF-06 | **Colaboración simultánea**: WebSocket (STOMP) permite actualizaciones en tiempo real a múltiples usuarios. |
| RNF-07 | **Trazabilidad**: Toda acción relevante queda registrada en la bitácora de auditoría (`audit_logs`). |
| RNF-08 | **Mantenibilidad**: Migraciones de base de datos versionadas con Flyway; código organizado por capas (controller, service, repository, entity). |
| RNF-09 | **Usabilidad**: Interfaz con etiquetas visuales de color para identificación rápida del estado de tareas. |
| RNF-10 | **Portabilidad**: Backend dockerizable; frontend desplegable como SPA estática. |
| RNF-11 | **Resiliencia de email**: Reintentos automáticos con Spring Retry ante fallos del servidor de correo. |

---

## 👥 Casos de Uso y Actores

---

### Descripción de Actores

| Actor | Descripción | Acceso |
|-------|-------------|--------|
| **SUPER_ADMIN** | Administrador global del sistema. Gestiona organizaciones y sus primeros administradores. Ve métricas y bitácoras de todo el sistema. No tiene org asignada. | `smartworkflow.app/login` |
| **ADMIN** | Administrador de una organización específica. Gestiona usuarios, departamentos y políticas BPM de su org. | `{slug}.smartworkflow.app/login` |
| **MANAGER** | Jefe de departamento. Supervisa los flujos de su área, aprueba decisiones en gateways XOR, puede registrar clientes. | `{slug}.smartworkflow.app/login` |
| **OFFICER** | Funcionario operativo. Ejecuta las tareas asignadas a su departamento, llena formularios, registra clientes y genera trámites. | `{slug}.smartworkflow.app/login` |
| **CLIENTE** | Ciudadano o usuario externo. No tiene cuenta en el sistema. Puede rastrear su trámite con un código de seguimiento. | `{slug}.smartworkflow.app/track` |

---

### Listado de Casos de Uso

| ID | Caso de Uso | Actor Principal | Descripción |
|----|-------------|-----------------|-------------|
| CU-01 | Crear organización | SUPER_ADMIN | Registra una nueva organización con nombre, slug y primer ADMIN. |
| CU-02 | Ver bitácora global | SUPER_ADMIN | Consulta todos los registros de auditoría del sistema. |
| CU-03 | Gestionar usuarios | ADMIN | Crea, edita y desactiva usuarios MANAGER y OFFICER de su org. |
| CU-04 | Gestionar departamentos | ADMIN | Crea y organiza departamentos jerárquicos dentro de su org. |
| CU-05 | Diseñar política BPM | ADMIN | Usa el editor visual para definir actividades, gateways y transiciones del flujo. |
| CU-06 | Activar/archivar política | ADMIN | Cambia el estado de una política entre DRAFT, ACTIVE y ARCHIVED. |
| CU-07 | Ver métricas de organización | ADMIN | Visualiza throughput, tiempos promedio y cuellos de botella de su org. |
| CU-08 | Supervisar flujos activos | MANAGER | Ve todos los trámites activos en su departamento y su estado. |
| CU-09 | Aprobar/rechazar gateway XOR | MANAGER | Toma la decisión de enrutamiento en un punto de bifurcación del flujo. |
| CU-10 | Ver bandeja de tareas | OFFICER | Visualiza las actividades pendientes asignadas a su departamento con colores de estado. |
| CU-11 | Registrar cliente | OFFICER / MANAGER | Crea un perfil de cliente (nombre, CI, email, teléfono) en el sistema. |
| CU-12 | Iniciar trámite | OFFICER / MANAGER | Asocia un cliente a una política BPM activa y genera el código de seguimiento. |
| CU-13 | Completar tarea/actividad | OFFICER | Llena el formulario dinámico de una actividad y avanza el trámite al siguiente paso. |
| CU-14 | Rastrear trámite | CLIENTE | Ingresa su código de seguimiento y ve en qué departamento se encuentra su trámite. |
| CU-15 | Descargar comprobante PDF | CLIENTE | Al finalizar el trámite, descarga el comprobante con código QR. |
| CU-16 | Recibir notificación | OFFICER / MANAGER / CLIENTE | Recibe alertas en tiempo real (WebSocket) o por correo ante cambios en el trámite. |
| CU-17 | Ver alertas de SLA | MANAGER / ADMIN | Visualiza actividades que superaron el tiempo máximo permitido (cuellos de botella). |
| CU-18 | Iniciar sesión | Todos los internos | Autentica al usuario según su rol y organización, recibiendo un JWT. |
| CU-19 | Cerrar sesión | Todos los internos | Invalida la sesión en el cliente. |

---

## 🗂️ FLUJO DE TRABAJO DE DISEÑO

---

### Paquetes del Sistema y sus Relaciones

#### Backend — Spring Boot

```
com.example.smartworkflow
├── config/              ← Configuraciones globales (BD, Mail, Retry, Swagger, WebSocket)
├── controller/          ← API REST (endpoints HTTP)
│   ├── AuthController       ← /api/auth/login
│   ├── OrganizationController ← /api/organizations
│   ├── UserController       ← /api/users
│   ├── DepartmentController ← /api/departments
│   ├── PolicyController     ← /api/policies
│   ├── CaseController       ← /api/cases
│   ├── ClientController     ← /api/clients
│   ├── NotificationController ← /api/notifications
│   ├── AnalyticsController  ← /api/analytics
│   └── AuditLogController   ← /api/audit-logs
├── service/             ← Lógica de negocio
│   ├── AuthService          ← Autenticación y JWT
│   ├── CaseEngine           ← Motor de flujo BPM (avance de tokens)
│   ├── ConditionEvaluator   ← Evaluación de condiciones en gateways
│   ├── PolicyDeserializer   ← Conversión diagrama JSON → modelo de ejecución
│   ├── BottleneckAnalyzer   ← Detección de cuellos de botella por SLA
│   ├── SLAMonitor           ← Monitoreo periódico de violaciones de SLA
│   ├── WebSocketNotifier    ← Envío de mensajes STOMP en tiempo real
│   └── EmailService         ← Envío de correos (Thymeleaf + SMTP)
├── entity/              ← Entidades JPA (mapeo a tablas PostgreSQL)
│   ├── Organization, Department, User, Client
│   ├── Policy, Activity, Transition
│   ├── WorkflowCase, CaseToken, CaseHistory
│   ├── Notification, AuditLog, SlaViolation
│   └── FormTemplate
├── repository/          ← Interfaces Spring Data JPA
├── dto/                 ← Objetos de transferencia de datos
├── event/               ← Eventos de dominio (CaseStarted, CaseAdvanced, etc.)
│   └── listener/        ← Manejadores de eventos (email, notificaciones)
└── email/               ← Servicio de email con reintentos
```

**Relaciones entre paquetes:**
- `controller` → depende de `service` (inyección de dependencias)
- `service` → depende de `repository` y `entity`
- `service.CaseEngine` → usa `PolicyDeserializer`, `ConditionEvaluator`, `WebSocketNotifier` y publica eventos de dominio
- `event.listener` → escucha eventos del `CaseEngine` y dispara `EmailService`
- `config` → configura `service.WebSocketNotifier` (STOMP broker) y `EmailService` (SMTP)

#### Frontend — Angular 17

```
src/app/
├── core/
│   ├── auth/           ← Login, guards de rol, interceptor HTTP (JWT)
│   │   ├── auth.service.ts      ← Gestión de sesión y JWT local
│   │   ├── login.component      ← Pantalla de inicio de sesión
│   │   ├── role.guard.ts        ← Protección de rutas por rol
│   │   ├── tenant.service.ts    ← Detección del tenant (subdominio / ?tenant=)
│   │   └── interceptors.ts      ← Adjunta JWT a cada petición HTTP
│   ├── api/            ← Servicios HTTP por dominio
│   │   ├── analytics.service, audit-log.service, case.service
│   │   ├── client.service, department.service, organization.service
│   │   ├── policy.service, tracking.service, user.service
│   │   └── sse-tracking.service ← Eventos SSE para tracking en tiempo real
│   └── websocket/
│       └── websocket.service.ts ← Conexión STOMP para notificaciones live
├── features/
│   ├── bpm-landing/    ← Página de inicio pública
│   ├── cases/          ← Bandeja de tareas y detalle de tarea (OFFICER)
│   ├── dashboard/      ← Dashboard departamental (MANAGER)
│   ├── policy-editor/  ← Editor BPM visual + form-builder por actividad
│   ├── super-admin/    ← Dashboard global del sistema (SUPER_ADMIN)
│   ├── track/          ← Página pública de rastreo de trámite + stepper + ETA
│   └── users/          ← Gestión de usuarios (ADMIN)
└── shared/
    └── components/navbar ← Barra de navegación adaptativa por rol
```

**Relaciones entre módulos:**
- `features/*` → consumen `core/api/*` para comunicarse con el backend
- `features/*` → usan `core/auth/role.guard` para control de acceso
- `core/auth/interceptors` → inyecta automáticamente el JWT en toda petición HTTP
- `core/websocket` → alimenta notificaciones en tiempo real a `features/dashboard` y `features/cases`
- `core/auth/tenant.service` → proporciona el `orgSlug` a todos los servicios de `core/api`

---

### Despliegue

| Componente | Tecnología | Entorno Dev | Entorno Prod |
|------------|------------|-------------|--------------|
| Frontend | Angular 17 + Tailwind CSS | `localhost:4200` | Vercel / Netlify (SPA) |
| Backend | Spring Boot 3.2 + Java 21 | `localhost:8080` | Railway / Render / VPS |
| Base de Datos | PostgreSQL 15 | Docker local | Railway PostgreSQL / Supabase |
| Email | SMTP (Gmail / Mailgun) | Mailtrap (mock) | Gmail SMTP / Mailgun |
| Tiempo Real | WebSocket (STOMP) | `ws://localhost:8080/ws` | `wss://api.smartworkflow.app/ws` |

**Variables de entorno clave (`.env.example`):**
```
DB_URL=jdbc:postgresql://localhost:5432/smartworkflow
DB_USERNAME=postgres
DB_PASSWORD=...
JWT_SECRET=...
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
```

**Estrategia de tenant en producción:**
```
smartworkflow.app          → Super Admin
cre.smartworkflow.app      → Login y tracking de CRE
hospital.smartworkflow.app → Login y tracking del Hospital
```

---

### Diagrama de Clases UML (Modelo de Dominio)

```
┌──────────────────┐       ┌──────────────────┐
│   Organization   │1    *│    Department    │
│──────────────────│───────│──────────────────│
│ id: UUID         │       │ id: UUID         │
│ name: String     │       │ org_id: UUID     │
│ slug: String     │       │ name: String     │
│ logo_url: String │       │ code: String     │
│ settings: JSONB  │       │ parent_id: UUID  │
│ created_at       │       │ manager_user_id  │
└──────────────────┘       └──────────────────┘
        │1                          │1
        │                           │
        │*                          │*
┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Client       │
│──────────────────│       │──────────────────│
│ id: UUID         │       │ id: UUID         │
│ org_id: UUID     │       │ org_id: UUID     │
│ department_id    │       │ name: String     │
│ name: String     │       │ email: String    │
│ email: String    │       │ phone: String    │
│ password_hash    │       │ dni: String      │
│ role: ENUM       │       │ created_by: UUID │
│ status: ENUM     │       └──────────────────┘
└──────────────────┘               │1
                                   │*
┌──────────────────┐       ┌──────────────────┐
│     Policy       │1    *│  WorkflowCase    │
│──────────────────│───────│──────────────────│
│ id: UUID         │       │ id: UUID         │
│ org_id: UUID     │       │ policy_id: UUID  │
│ name: String     │       │ org_id: UUID     │
│ description      │       │ client_id: UUID  │
│ version: Int     │       │ tracking_code    │
│ status: ENUM     │       │ status: ENUM     │
│ diagram_json     │       │ priority: ENUM   │
└──────────────────┘       │ started_at       │
        │1                  └──────────────────┘
        │                           │1
        │*                          │*
┌──────────────────┐       ┌──────────────────┐
│    Activity      │       │   CaseToken      │
│──────────────────│       │──────────────────│
│ id: UUID         │       │ id: UUID         │
│ policy_id: UUID  │       │ case_id: UUID    │
│ name: String     │       │ activity_id      │
│ type: ENUM       │       │ status: ENUM     │
│ dept_id: UUID    │       │ assigned_user_id │
│ sla_hours: Int   │       │ started_at       │
│ form_schema      │       │ completed_at     │
│ canvas_x/y: Int  │       │ form_data: JSONB │
└──────────────────┘       │ notes: Text      │
        │                  └──────────────────┘
        │*                          │*
┌──────────────────┐       ┌──────────────────┐
│   Transition     │       │  CaseHistory     │
│──────────────────│       │──────────────────│
│ id: UUID         │       │ id: UUID         │
│ policy_id: UUID  │       │ case_id: UUID    │
│ from_activity_id │       │ activity_id      │
│ to_activity_id   │       │ user_id: UUID    │
│ condition_expr   │       │ action: String   │
│ label: String    │       │ old/new_status   │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  Notification    │       │   AuditLog       │
│──────────────────│       │──────────────────│
│ id: UUID         │       │ id: UUID         │
│ user_id: UUID    │       │ org_id: UUID     │
│ case_id: UUID    │       │ user_id: UUID    │
│ type: String     │       │ action: String   │
│ title: String    │       │ entity_type      │
│ message: Text    │       │ entity_id: UUID  │
│ is_read: Boolean │       │ ip_address       │
└──────────────────┘       │ metadata: JSONB  │
                            └──────────────────┘

┌──────────────────┐
│  SlaViolation    │
│──────────────────│
│ id: UUID         │
│ token_id: UUID   │
│ activity_id      │
│ case_id: UUID    │
│ sla_hours: Int   │
│ actual_hours: D  │
│ recorded_at      │
└──────────────────┘
```

---

### Base de Datos

**Motor:** PostgreSQL 15  
**Migración:** Flyway (versionado — `V1__init_schema.sql`, `V2__seed_data.sql`)

**Tablas principales:**

| Tabla | Descripción |
|-------|-------------|
| `organizations` | Empresas/instituciones registradas en el sistema |
| `departments` | Departamentos/áreas de cada organización |
| `users` | Usuarios internos del sistema (SUPER_ADMIN, ADMIN, MANAGER, OFFICER) |
| `clients` | Perfiles de clientes/ciudadanos (sin cuenta, acceden por código) |
| `policies` | Plantillas BPM con el diagrama del flujo en JSON |
| `activities` | Nodos del flujo BPM (TASK, GATEWAY_XOR, GATEWAY_AND, EVENT) |
| `transitions` | Aristas del flujo (conexiones entre actividades, con condiciones) |
| `cases` | Trámites activos con código de seguimiento único |
| `case_tokens` | Posición actual de cada trámite en el flujo (token de ejecución) |
| `case_history` | Bitácora detallada de cada movimiento en el trámite |
| `notifications` | Notificaciones en tiempo real por usuario |
| `audit_logs` | Bitácora global de acciones del sistema (visible para SUPER_ADMIN) |
| `form_templates` | Plantillas de formularios por departamento/política |
| `sla_violations` | Registro de actividades que superaron el tiempo SLA |

**Tipos de flujo soportados:**

| Tipo de Gateway | Descripción |
|-----------------|-------------|
| `TASK` | Actividad lineal/secuencial asignada a un departamento |
| `GATEWAY_XOR` | Flujo alternativo (se elige uno de varios caminos) |
| `GATEWAY_AND` | Flujo paralelo (se activan múltiples caminos simultáneamente) |
| `EVENT` | Evento de inicio o fin del proceso |

---

## ⚙️ FLUJO DE TRABAJO DE IMPLEMENTACIÓN

---

### Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Frontend** | Angular | 17 |
| Estilos | Tailwind CSS | 3.x |
| Tiempo real (cliente) | STOMP over WebSocket | — |
| **Backend** | Spring Boot | 3.2.5 |
| Lenguaje | Java | 21 |
| Seguridad | Spring Security + JWT (jjwt) | 0.12.5 |
| Persistencia | Spring Data JPA + Hibernate 6 | — |
| **Base de Datos** | PostgreSQL | 15 |
| Migraciones | Flyway | — |
| Documentación API | SpringDoc OpenAPI (Swagger UI) | 2.3.0 |
| Tiempo real (servidor) | Spring WebSocket + STOMP | — |
| Email | Spring Mail + Thymeleaf | — |
| Rate Limiting | Bucket4j | 8.9.0 |
| JSONB support | Hypersistence Utils | 3.7.3 |
| QR Codes | Google ZXing | 3.5.3 |
| Retry | Spring Retry + Spring AOP | — |

---

### Diagrama de Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTES WEB                               │
│                                                                     │
│   Navegador del Admin/Manager/Officer    Navegador del Cliente      │
│   {slug}.smartworkflow.app/login         {slug}.smartworkflow.app/track│
└────────────────────────┬────────────────────────┬───────────────────┘
                         │ HTTPS / WSS             │ HTTPS
                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND — Angular 17 SPA                       │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ BPM Editor  │  │ Task Inbox   │  │  Dashboard │  │  Track   │  │
│  │ (policy)    │  │ (officer)    │  │  (manager) │  │ (public) │  │
│  └─────────────┘  └──────────────┘  └────────────┘  └──────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Core: AuthService · TenantService · WebSocketService        │  │
│  │  Interceptor JWT · RoleGuard · API Services (HTTP)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │ REST API (JSON) + WebSocket (STOMP)
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND — Spring Boot 3.2                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ Controllers  │  │   Services   │  │   Security Layer          │ │
│  │ (REST API)   │─▶│  Auth        │  │   JWT Filter              │ │
│  │              │  │  CaseEngine  │  │   Role-based Access       │ │
│  │ /api/auth    │  │  PolicyDeser.│  │   Rate Limiting (Bucket4j)│ │
│  │ /api/cases   │  │  Bottleneck  │  └───────────────────────────┘ │
│  │ /api/policies│  │  SLAMonitor  │                                 │
│  │ /api/track   │  │  WebSocket   │  ┌───────────────────────────┐ │
│  │ /api/...     │  │  Notifier    │  │   Event System            │ │
│  └──────────────┘  │  EmailService│  │   CaseStartedEvent        │ │
│                    └──────┬───────┘  │   CaseAdvancedEvent       │ │
│                           │          │   SlaViolatedEvent        │ │
│  ┌────────────────────────▼──────┐   └───────────────────────────┘ │
│  │        Repositories (JPA)     │                                  │
│  └────────────────────────┬──────┘                                  │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ JDBC
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│               BASE DE DATOS — PostgreSQL 15                         │
│                                                                     │
│  organizations · departments · users · clients · policies           │
│  activities · transitions · cases · case_tokens · case_history      │
│  notifications · audit_logs · form_templates · sla_violations       │
│                                                                     │
│  [Flyway Migrations: V1__init_schema.sql · V2__seed_data.sql]       │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  SMTP Server  │
                    │  (Email)      │
                    └───────────────┘
```

---

### JWT Claims

```json
{
  "sub":     "uuid-del-usuario",
  "role":    "SUPER_ADMIN | ADMIN | MANAGER | OFFICER",
  "orgId":   "uuid-de-la-org | null",
  "orgSlug": "cre | null",
  "deptId":  "uuid-del-dept | null",
  "iat": 1714300827,
  "exp": 1714304427
}
```

### Seed Data de Referencia

| Email | Contraseña | Rol | Organización |
|-------|------------|-----|--------------|
| `superadmin@smartworkflow.app` | `admin2026!` | SUPER_ADMIN | — |
| `admin@cre.com` | `password123` | ADMIN | CRE |
| `manager@cre.com` | `password123` | MANAGER | CRE |
| `officer@cre.com` | `password123` | OFFICER | CRE |

---

## 🧪 FLUJO DE TRABAJO DE PRUEBA

---

### Documentación de la API (Swagger UI)

Al correr el backend en desarrollo, la documentación interactiva de todos los endpoints está disponible en:

```
http://localhost:8080/swagger-ui/index.html
```

### Acceso de Prueba (Desarrollo Local)

**Backend:** `http://localhost:8080`  
**Frontend:** `http://localhost:4200`

**Rutas de prueba por rol:**

| Rol | URL en dev |
|-----|------------|
| Super Admin | `http://localhost:4200/super-admin` |
| Admin (CRE) | `http://localhost:4200/admin?tenant=cre` |
| Manager (CRE) | `http://localhost:4200/manager?tenant=cre` |
| Officer (CRE) | `http://localhost:4200/officer?tenant=cre` |
| Track público | `http://localhost:4200/track?tenant=cre` |

### Cómo correr el proyecto localmente

**Backend:**
```bash
cd "backend - springboot/smartworkflow"
cp .env.example .env   # completar credenciales
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend:**
```bash
cd "frontend - angular"
npm install
ng serve
```

**Base de datos (Docker):**
```bash
docker run -d \
  --name smartworkflow-db \
  -e POSTGRES_DB=smartworkflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

---

## 🔗 Repositorios del Proyecto

| Componente | Repositorio | QR |
|------------|-------------|-----|
| **Backend** (Spring Boot) | https://github.com/Job-Natanael-Contreras-Garzon/SmartWORKFLOWBACKEND | _(escanear)_ |
| **Frontend** (Angular) | _[insertar enlace del repo frontend aquí]_ | _(escanear)_ |
| **Base de Datos / Docs** | _[insertar enlace adicional si aplica]_ | _(escanear)_ |

> 📌 **Nota:** Completar los enlaces de los repositorios del frontend y cualquier repo adicional antes de presentar.

---

## 📊 Niveles de Innovación del Proyecto

| Nivel | Descripción | Estado |
|-------|-------------|--------|
| **Nivel 1** | Sistema base de gestión de políticas de negocio (BPM), motor de flujo, paneles por rol | ✅ Implementado |
| **Nivel 2** | Tracking público del trámite con código de seguimiento, vista del stepper por departamentos, descarga de comprobante en PDF con QR | ✅ Implementado |
| **Nivel 3** | Asistente IA para diseño de diagramas (comandos de voz → diagrama), análisis predictivo de cuellos de botella, colaboración 100% simultánea en tiempo real | 🚧 En desarrollo |

---

*Documento generado: 2026-04-29 · SmartWORKFLOW — Ingeniería de Software I*
