{
  "security_note": "La especificación define 'Bearer Authentication' (JWT) a nivel global. Sin embargo, los endpoints de autenticación (login, logout, refresh) típicamente son públicos (no requieren token). Se marca securityRequired: false para ellos. El endpoint impersonate sí requiere autenticación de administrador.",
  "endpoints": [
    {
      "path": "/api/auth/login",
      "method": "POST",
      "tags": ["auth-controller"],
      "operationId": "login",
      "securityRequired": false,
      "requestBodySchema": "LoginRequest",
      "requestBodyRequired": true,
      "responseSchema": "LoginResponse",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/auth/refresh",
      "method": "POST",
      "tags": ["auth-controller"],
      "operationId": "refresh",
      "securityRequired": false,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "object",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/auth/logout",
      "method": "POST",
      "tags": ["auth-controller"],
      "operationId": "logout",
      "securityRequired": false,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "object",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/auth/impersonate",
      "method": "POST",
      "tags": ["auth-controller"],
      "operationId": "impersonate",
      "securityRequired": true,
      "requestBodySchema": "object (map string -> uuid)",
      "requestBodyRequired": true,
      "responseSchema": "LoginResponse",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/users",
      "method": "GET",
      "tags": ["user-controller"],
      "operationId": "getAllUsers",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of User",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/users",
      "method": "POST",
      "tags": ["user-controller"],
      "operationId": "createUser",
      "securityRequired": true,
      "requestBodySchema": "User",
      "requestBodyRequired": true,
      "responseSchema": "User",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/users/me",
      "method": "GET",
      "tags": ["user-controller"],
      "operationId": "getMyProfile",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "User",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/users/{id}",
      "method": "PUT",
      "tags": ["user-controller"],
      "operationId": "updateUser",
      "securityRequired": true,
      "requestBodySchema": "User",
      "requestBodyRequired": true,
      "responseSchema": "User",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/users/{id}",
      "method": "DELETE",
      "tags": ["user-controller"],
      "operationId": "softDeleteUser",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": null,
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/policies",
      "method": "GET",
      "tags": ["policy-controller"],
      "operationId": "getPolicies",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of Policy",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/policies",
      "method": "POST",
      "tags": ["policy-controller"],
      "operationId": "createPolicy",
      "securityRequired": true,
      "requestBodySchema": "Policy",
      "requestBodyRequired": true,
      "responseSchema": "Policy",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/policies/{id}",
      "method": "PUT",
      "tags": ["policy-controller"],
      "operationId": "updatePolicyDetails",
      "securityRequired": true,
      "requestBodySchema": "Policy",
      "requestBodyRequired": true,
      "responseSchema": "Policy",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/policies/{id}/publish",
      "method": "PUT",
      "tags": ["policy-controller"],
      "operationId": "publishPolicy",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "Policy",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/policies/{id}/diagram",
      "method": "PUT",
      "tags": ["policy-controller"],
      "operationId": "saveDiagram",
      "securityRequired": true,
      "requestBodySchema": "object (additionalProperties: object)",
      "requestBodyRequired": true,
      "responseSchema": "Policy",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/policies/{id}/deprecate",
      "method": "PUT",
      "tags": ["policy-controller"],
      "operationId": "deprecatePolicy",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "Policy",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/policies/{id}/validate",
      "method": "POST",
      "tags": ["policy-controller"],
      "operationId": "validateGraph",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of string",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/organizations",
      "method": "GET",
      "tags": ["organization-controller"],
      "operationId": "listAll",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of Organization",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/organizations",
      "method": "POST",
      "tags": ["organization-controller"],
      "operationId": "create",
      "securityRequired": true,
      "requestBodySchema": "CreateOrgRequest",
      "requestBodyRequired": true,
      "responseSchema": "object",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/organizations/{orgId}",
      "method": "GET",
      "tags": ["organization-controller"],
      "operationId": "getById",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "Organization",
      "pathParams": [
        { "name": "orgId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/organizations/{orgId}",
      "method": "PUT",
      "tags": ["organization-controller"],
      "operationId": "update",
      "securityRequired": true,
      "requestBodySchema": "UpdateOrgRequest",
      "requestBodyRequired": true,
      "responseSchema": "object",
      "pathParams": [
        { "name": "orgId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/organizations/{orgId}/users",
      "method": "GET",
      "tags": ["organization-controller"],
      "operationId": "listOrgUsers",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of User",
      "pathParams": [
        { "name": "orgId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/departments",
      "method": "GET",
      "tags": ["department-controller"],
      "operationId": "getAllDepartments",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of Department",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/departments",
      "method": "POST",
      "tags": ["department-controller"],
      "operationId": "createDepartment",
      "securityRequired": true,
      "requestBodySchema": "Department",
      "requestBodyRequired": true,
      "responseSchema": "Department",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/departments/{id}",
      "method": "PUT",
      "tags": ["department-controller"],
      "operationId": "updateDepartment",
      "securityRequired": true,
      "requestBodySchema": "Department",
      "requestBodyRequired": true,
      "responseSchema": "Department",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/departments/{id}",
      "method": "DELETE",
      "tags": ["department-controller"],
      "operationId": "deleteDepartment",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": null,
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/departments/{id}/members",
      "method": "GET",
      "tags": ["department-controller"],
      "operationId": "getDepartmentMembers",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of User",
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/clients",
      "method": "GET",
      "tags": ["client-controller"],
      "operationId": "list",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of Client",
      "pathParams": [],
      "queryParams": [
        { "name": "search", "type": "string", "required": false, "description": "Filtro de búsqueda" }
      ]
    },
    {
      "path": "/api/clients",
      "method": "POST",
      "tags": ["client-controller"],
      "operationId": "create_1",
      "securityRequired": true,
      "requestBodySchema": "CreateClientRequest",
      "requestBodyRequired": true,
      "responseSchema": "Client",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/clients/{clientId}",
      "method": "GET",
      "tags": ["client-controller"],
      "operationId": "getById_1",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "Client",
      "pathParams": [
        { "name": "clientId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/clients/{clientId}",
      "method": "PUT",
      "tags": ["client-controller"],
      "operationId": "update_1",
      "securityRequired": true,
      "requestBodySchema": "CreateClientRequest",
      "requestBodyRequired": true,
      "responseSchema": "object",
      "pathParams": [
        { "name": "clientId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/cases",
      "method": "POST",
      "tags": ["case-controller"],
      "operationId": "startNewCase",
      "securityRequired": true,
      "requestBodySchema": "CaseStartRequest",
      "requestBodyRequired": true,
      "responseSchema": "object (map string -> string)",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/cases/track/{trackingCode}",
      "method": "GET",
      "tags": ["case-controller"],
      "operationId": "trackCase",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "CaseTrackingResponse",
      "pathParams": [
        { "name": "trackingCode", "type": "string", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/cases/my-tasks",
      "method": "GET",
      "tags": ["case-controller"],
      "operationId": "getMyTasks",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "PageCaseToken",
      "pathParams": [],
      "queryParams": [
        { "name": "status", "type": "string", "required": false, "description": "Filtro por estado" },
        { "name": "priority", "type": "string", "required": false, "description": "Filtro por prioridad" },
        { "name": "pageable", "type": "Pageable", "required": true, "description": "Paginación (page, size, sort)" }
      ]
    },
    {
      "path": "/api/cases/department-tasks",
      "method": "GET",
      "tags": ["case-controller"],
      "operationId": "getDepartmentTasks",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of CaseToken",
      "pathParams": [],
      "queryParams": [
        { "name": "status", "type": "string", "required": false, "description": "Filtro por estado" }
      ]
    },
    {
      "path": "/api/cases/{caseId}/tokens/{tokenId}/complete",
      "method": "POST",
      "tags": ["case-controller"],
      "operationId": "completeTask",
      "securityRequired": true,
      "requestBodySchema": "object (additionalProperties: object)",
      "requestBodyRequired": true,
      "responseSchema": null,
      "pathParams": [
        { "name": "caseId", "type": "string", "format": "uuid", "required": true },
        { "name": "tokenId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/cases/{caseId}/tokens/{tokenId}/reassign",
      "method": "PUT",
      "tags": ["case-controller"],
      "operationId": "reassignTask",
      "securityRequired": true,
      "requestBodySchema": "ReassignRequest",
      "requestBodyRequired": true,
      "responseSchema": null,
      "pathParams": [
        { "name": "caseId", "type": "string", "format": "uuid", "required": true },
        { "name": "tokenId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/notifications",
      "method": "GET",
      "tags": ["notification-controller"],
      "operationId": "getUserNotifications",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "array of Notification",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/notifications/{id}/read",
      "method": "PUT",
      "tags": ["notification-controller"],
      "operationId": "markAsRead",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": null,
      "pathParams": [
        { "name": "id", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": []
    },
    {
      "path": "/api/notifications/read-all",
      "method": "PUT",
      "tags": ["notification-controller"],
      "operationId": "markAllAsRead",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": null,
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/notifications/read-all",
      "method": "DELETE",
      "tags": ["notification-controller"],
      "operationId": "deleteAllRead",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": null,
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/audit-logs/system",
      "method": "GET",
      "tags": ["audit-log-controller"],
      "operationId": "systemLogs",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "PageAuditLog",
      "pathParams": [],
      "queryParams": [
        { "name": "pageable", "type": "Pageable", "required": true, "description": "Paginación (page, size, sort)" }
      ]
    },
    {
      "path": "/api/audit-logs/org/{orgId}",
      "method": "GET",
      "tags": ["audit-log-controller"],
      "operationId": "orgLogs",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "PageAuditLog",
      "pathParams": [
        { "name": "orgId", "type": "string", "format": "uuid", "required": true }
      ],
      "queryParams": [
        { "name": "pageable", "type": "Pageable", "required": true, "description": "Paginación (page, size, sort)" }
      ]
    },
    {
      "path": "/api/audit-logs/global",
      "method": "GET",
      "tags": ["audit-log-controller"],
      "operationId": "globalLogs",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "PageAuditLog",
      "pathParams": [],
      "queryParams": [
        { "name": "pageable", "type": "Pageable", "required": true, "description": "Paginación (page, size, sort)" }
      ]
    },
    {
      "path": "/api/analytics/dashboard",
      "method": "GET",
      "tags": ["analytics-controller"],
      "operationId": "getGlobalDashboard",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "object (additionalProperties: object)",
      "pathParams": [],
      "queryParams": []
    },
    {
      "path": "/api/analytics/bottlenecks",
      "method": "GET",
      "tags": ["analytics-controller"],
      "operationId": "getBottleneckDashboard",
      "securityRequired": true,
      "requestBodySchema": null,
      "requestBodyRequired": false,
      "responseSchema": "object (additionalProperties: object)",
      "pathParams": [],
      "queryParams": [
        { "name": "policyId", "type": "string", "format": "uuid", "required": false, "description": "Filtro por política" },
        { "name": "departmentId", "type": "string", "format": "uuid", "required": false, "description": "Filtro por departamento" },
        { "name": "startDate", "type": "string", "format": "date-time", "required": false, "description": "Fecha inicio" },
        { "name": "endDate", "type": "string", "format": "date-time", "required": false, "description": "Fecha fin" }
      ]
    }
  ]
}

Todos los endpoints heredan Bearer Authentication a nivel global, excepto los marcados con securityRequired: false (login, refresh, logout).
Los esquemas de body y respuesta referencian los modelos definidos en la especificación OpenAPI (User, Policy, Organization, etc.).
Los endpoints con respuesta vacía (null) devuelven 200 OK sin contenido.
Los parámetros de paginación se indican como Pageable (objeto con page, size, sort).
El endpoint /api/auth/impersonate requiere autenticación (admin) y recibe un body con un mapa de strings a UUID (probablemente { userId: "uuid" }).
