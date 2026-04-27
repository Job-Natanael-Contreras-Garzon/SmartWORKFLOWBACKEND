-- ============================================================
-- V1: Schema completo SmartWORKFLOW Multi-Tenant
-- Revisión: 2026-04-27  (reseteo total por nueva arquitectura)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) UNIQUE NOT NULL,   -- usado como subdominio
    logo_url   VARCHAR(512),
    settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    parent_id       UUID REFERENCES departments(id) ON DELETE RESTRICT,
    manager_user_id UUID,                      -- FK diferida (users aún no existe)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (code, org_id)
);

-- ============================================================
-- 3. USERS
-- org_id es NULLABLE para el SUPER_ADMIN (usuario de sistema)
-- role incluye SUPER_ADMIN como nivel más alto
-- ============================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id        UUID REFERENCES organizations(id) ON DELETE RESTRICT,  -- NULL = SUPER_ADMIN
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL
                  CHECK (role IN ('SUPER_ADMIN','ADMIN','MANAGER','OFFICER')),
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
    avatar_url    VARCHAR(512),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- email único globalmente para SUPER_ADMIN (org_id IS NULL)
    -- email único por org para el resto
    UNIQUE (email, org_id)
);

-- FK diferida: manager_user_id de departments apunta a users
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 4. CLIENTS
-- Perfiles de ciudadanos/clientes creados por OFFICER o MANAGER.
-- No tienen cuenta en el sistema; acceden vía código de tracking.
-- ============================================================
CREATE TABLE clients (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255),
    phone      VARCHAR(50),
    dni        VARCHAR(50),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. POLICIES (plantillas BPM)
-- ============================================================
CREATE TABLE policies (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    version      INT NOT NULL DEFAULT 1,
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                 CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
    created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    diagram_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. ACTIVITIES (nodos del flujo BPM)
-- ============================================================
CREATE TABLE activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id           UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    type                VARCHAR(30) NOT NULL
                        CHECK (type IN ('TASK','GATEWAY_XOR','GATEWAY_AND','EVENT')),
    responsible_dept_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    sla_hours           INT,
    form_schema         JSONB NOT NULL DEFAULT '{}'::jsonb,
    canvas_x            INT,
    canvas_y            INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. TRANSITIONS (aristas del flujo BPM)
-- ============================================================
CREATE TABLE transitions (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id            UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    from_activity_id     UUID REFERENCES activities(id) ON DELETE CASCADE,
    to_activity_id       UUID REFERENCES activities(id) ON DELETE CASCADE,
    condition_expression TEXT,
    label                VARCHAR(255),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. CASES (trámites activos)
-- Cada caso pertenece a un cliente y tiene un código único de seguimiento.
-- tracking_code: alfanumérico corto legible por el ciudadano (ej. CRE-2026-A3F7)
-- ============================================================
CREATE TABLE cases (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id      UUID NOT NULL REFERENCES policies(id) ON DELETE RESTRICT,
    org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
    tracking_code  VARCHAR(20) UNIQUE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                   CHECK (status IN ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED')),
    priority       VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
                   CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at   TIMESTAMPTZ
);

-- ============================================================
-- 9. CASE_TOKENS (tokens de flujo — posición actual del caso)
-- ============================================================
CREATE TABLE case_tokens (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id          UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    activity_id      UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','IN_PROGRESS','DONE','SKIPPED','JOIN_ARRIVED')),
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at     TIMESTAMPTZ,
    form_data        JSONB DEFAULT '{}'::jsonb,
    notes            TEXT
);

-- ============================================================
-- 10. CASE_HISTORY (bitácora de cada trámite)
-- ============================================================
CREATE TABLE case_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(255) NOT NULL,
    old_status  VARCHAR(50),
    new_status  VARCHAR(50),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id    UUID REFERENCES cases(id) ON DELETE CASCADE,
    type       VARCHAR(100) NOT NULL,
    title      VARCHAR(255),
    message    TEXT NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. AUDIT_LOGS (bitácora del sistema — visible para SUPER_ADMIN)
-- org_id NULL = acción de nivel sistema (crear org, asignar admin, etc.)
-- ============================================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,     -- 'CREATE_ORG', 'CREATE_USER', 'LOGIN', etc.
    entity_type VARCHAR(50),               -- 'ORGANIZATION', 'USER', 'CASE', 'POLICY'
    entity_id   UUID,
    ip_address  VARCHAR(45),
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. FORM_TEMPLATES
-- ============================================================
CREATE TABLE form_templates (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dept_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    name      VARCHAR(255) NOT NULL,
    schema    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. SLA_VIOLATIONS
-- ============================================================
CREATE TABLE sla_violations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id    UUID NOT NULL REFERENCES case_tokens(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sla_hours   INT,
    actual_hours DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES de rendimiento
-- ============================================================
CREATE INDEX idx_users_email_org        ON users(email, org_id);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_cases_tracking_code    ON cases(tracking_code);
CREATE INDEX idx_cases_org_status       ON cases(org_id, status);
CREATE INDEX idx_case_tokens_activity   ON case_tokens(activity_id);
CREATE INDEX idx_case_tokens_case       ON case_tokens(case_id, status);
CREATE INDEX idx_notifications_user     ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_org         ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_user        ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_clients_org            ON clients(org_id);