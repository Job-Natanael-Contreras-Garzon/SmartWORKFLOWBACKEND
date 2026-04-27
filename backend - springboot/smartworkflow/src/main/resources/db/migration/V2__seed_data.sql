-- ============================================================
-- V2: Seed Data — SmartWORKFLOW Multi-Tenant
-- Revisión: 2026-04-27
-- NOTA: Todos los UUIDs deben usar solo caracteres hex (0-9, a-f)
--
-- Usuarios org CRE  → password: password123
-- Hash BCrypt: $2a$10$52VJGB8vjc/F7JgH.pamTuhkPI.9fQLtH/uCJyhQvLycFgQRMu3A6
--
-- SUPER_ADMIN       → password: admin2026!
-- Hash BCrypt: $2a$10$fBI8uqfGh0KJpjMnZCINqefZj7iswJ8T7mM1TCYYpeTaN6R97Jdo2
-- ============================================================

-- ============================================================
-- 1. SUPER_ADMIN del sistema (org_id NULL)
-- Prefijo: aa = super admin
-- ============================================================
INSERT INTO users (id, org_id, department_id, name, email, password_hash, role, status)
VALUES (
    'aa000000-0000-0000-0000-000000000001',
    NULL,
    NULL,
    'Super Administrador',
    'superadmin@smartworkflow.app',
    '$2a$10$fBI8uqfGh0KJpjMnZCINqefZj7iswJ8T7mM1TCYYpeTaN6R97Jdo2',
    'SUPER_ADMIN',
    'ACTIVE'
);

-- ============================================================
-- 2. Organización de prueba: CRE
-- Prefijo: bb = organización
-- ============================================================
INSERT INTO organizations (id, name, slug, settings)
VALUES (
    'bb000000-0000-0000-0000-000000000001',
    'Cooperativa Rural de Electrificación (CRE)',
    'cre',
    '{"theme": "blue", "locale": "es-BO"}'
);

-- ============================================================
-- 3. Departamentos de CRE
-- Prefijo: dd = departamento
-- ============================================================
INSERT INTO departments (id, org_id, name, code)
VALUES
    ('dd000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'Recursos Humanos',    'HR-001'),
    ('dd000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000001', 'Atención al Cliente', 'CS-001');

-- ============================================================
-- 4. Usuarios de CRE (password: password123)
-- Prefijo: ee = empleado/usuario
-- ============================================================
-- ADMIN de CRE
INSERT INTO users (id, org_id, department_id, name, email, password_hash, role, status)
VALUES (
    'ee000000-0000-0000-0000-000000000001',
    'bb000000-0000-0000-0000-000000000001',
    NULL,
    'Admin CRE',
    'admin@cre.com',
    '$2a$10$52VJGB8vjc/F7JgH.pamTuhkPI.9fQLtH/uCJyhQvLycFgQRMu3A6',
    'ADMIN',
    'ACTIVE'
);

-- MANAGER de Recursos Humanos
INSERT INTO users (id, org_id, department_id, name, email, password_hash, role, status)
VALUES (
    'ee000000-0000-0000-0000-000000000002',
    'bb000000-0000-0000-0000-000000000001',
    'dd000000-0000-0000-0000-000000000001',
    'Gerente RRHH',
    'manager@cre.com',
    '$2a$10$52VJGB8vjc/F7JgH.pamTuhkPI.9fQLtH/uCJyhQvLycFgQRMu3A6',
    'MANAGER',
    'ACTIVE'
);

-- OFFICER de Atención al Cliente
INSERT INTO users (id, org_id, department_id, name, email, password_hash, role, status)
VALUES (
    'ee000000-0000-0000-0000-000000000003',
    'bb000000-0000-0000-0000-000000000001',
    'dd000000-0000-0000-0000-000000000002',
    'Oficial Plataforma',
    'officer@cre.com',
    '$2a$10$52VJGB8vjc/F7JgH.pamTuhkPI.9fQLtH/uCJyhQvLycFgQRMu3A6',
    'OFFICER',
    'ACTIVE'
);

-- Asignar manager al departamento HR
UPDATE departments
SET manager_user_id = 'ee000000-0000-0000-0000-000000000002'
WHERE id = 'dd000000-0000-0000-0000-000000000001';

-- ============================================================
-- 5. Cliente de prueba (creado por el officer)
-- Prefijo: cc = cliente/ciudadano
-- ============================================================
INSERT INTO clients (id, org_id, name, email, phone, dni, created_by)
VALUES (
    'cc000000-0000-0000-0000-000000000001',
    'bb000000-0000-0000-0000-000000000001',
    'Juan Pérez López',
    'juan.perez@email.com',
    '+591 70000001',
    '1234567',
    'ee000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- 6. Política de ejemplo: "Reclamo por mala facturación"
-- Prefijo: ff = flujo/política
-- ============================================================
INSERT INTO policies (id, org_id, name, description, version, status, created_by)
VALUES (
    'ff000000-0000-0000-0000-000000000001',
    'bb000000-0000-0000-0000-000000000001',
    'Reclamo Mala Facturación',
    'Flujo de reclamo de cliente por cobro indebido en factura eléctrica',
    1,
    'ACTIVE',
    'ee000000-0000-0000-0000-000000000001'
);

-- ============================================================
-- 7. Actividades del flujo
-- Prefijo: ac = actividad
-- ============================================================
INSERT INTO activities (id, policy_id, name, type, responsible_dept_id)
VALUES
    ('ac000000-0000-0000-0000-000000000001', 'ff000000-0000-0000-0000-000000000001', 'Recepción de Reclamo', 'TASK',        'dd000000-0000-0000-0000-000000000002'),
    ('ac000000-0000-0000-0000-000000000002', 'ff000000-0000-0000-0000-000000000001', '¿Aprobar Reintegro?',  'GATEWAY_XOR', 'dd000000-0000-0000-0000-000000000001'),
    ('ac000000-0000-0000-0000-000000000003', 'ff000000-0000-0000-0000-000000000001', 'Ejecutar Reintegro',   'TASK',        'dd000000-0000-0000-0000-000000000001'),
    ('ac000000-0000-0000-0000-000000000004', 'ff000000-0000-0000-0000-000000000001', 'Notificar Rechazo',    'TASK',        'dd000000-0000-0000-0000-000000000002'),
    ('ac000000-0000-0000-0000-000000000005', 'ff000000-0000-0000-0000-000000000001', 'Cierre de Trámite',    'EVENT',       NULL);

-- ============================================================
-- 8. Transiciones del flujo
-- ============================================================
INSERT INTO transitions (policy_id, from_activity_id, to_activity_id, label)
VALUES
    ('ff000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000002', 'Enviar a Evaluación'),
    ('ff000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000002', 'ac000000-0000-0000-0000-000000000003', 'Aprobado'),
    ('ff000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000002', 'ac000000-0000-0000-0000-000000000004', 'Rechazado'),
    ('ff000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000003', 'ac000000-0000-0000-0000-000000000005', NULL),
    ('ff000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000004', 'ac000000-0000-0000-0000-000000000005', NULL);

-- ============================================================
-- 9. Caso de prueba con tracking code legible
-- Prefijo: ca = caso
-- ============================================================
INSERT INTO cases (id, policy_id, org_id, client_id, tracking_code, status, priority)
VALUES (
    'ca000000-0000-0000-0000-000000000001',
    'ff000000-0000-0000-0000-000000000001',
    'bb000000-0000-0000-0000-000000000001',
    'cc000000-0000-0000-0000-000000000001',
    'CRE-2026-A3F7',
    'IN_PROGRESS',
    'NORMAL'
);

-- Token activo en "Recepción de Reclamo"
-- Prefijo: c1 = case token
INSERT INTO case_tokens (id, case_id, activity_id, status, assigned_user_id)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'ca000000-0000-0000-0000-000000000001',
    'ac000000-0000-0000-0000-000000000001',
    'PENDING',
    'ee000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- 10. Audit log inicial
-- ============================================================
INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
VALUES
    (NULL,                                 'aa000000-0000-0000-0000-000000000001', 'CREATE_ORG',  'ORGANIZATION', 'bb000000-0000-0000-0000-000000000001', '{"slug": "cre"}'),
    (NULL,                                 'aa000000-0000-0000-0000-000000000001', 'CREATE_USER', 'USER',         'ee000000-0000-0000-0000-000000000001', '{"role": "ADMIN", "org": "cre"}'),
    ('bb000000-0000-0000-0000-000000000001','ee000000-0000-0000-0000-000000000003', 'CREATE_CLIENT','CLIENT',     'cc000000-0000-0000-0000-000000000001', '{"name": "Juan Pérez López"}');
