# 🧪 Tracker de Pruebas Unitarias - SmartWORKFLOW

Este documento servirá para llevar un registro de los tests implementados en los diferentes endpoints del backend, permitiendo detectar fallas y documentar las correcciones necesarias.

---

## 📅 Estado General

| Controlador | Total Endpoints | Cobertura (Tests) | Estado Actual | Observaciones / Fallas Encontradas |
|-------------|:---:|:---:|---|---|
| `AuthController` | 2 | 2 / 2 | 🟢 OK | Tests creados con MockMvc y Mockito. |
| `UserController` | 5 | 0 / 5 | ⚪ Pendiente | |
| `DepartmentController` | 5 | 0 / 5 | ⚪ Pendiente | |
| `PolicyController` | 6 | 0 / 6 | ⚪ Pendiente | |
| `CaseController` | 6 | 0 / 6 | ⚪ Pendiente | |
| `NotificationController` | 4 | 0 / 4 | ⚪ Pendiente | |
| `AnalyticsController` | 2 | 0 / 2 | ⚪ Pendiente | |

---

## ❌ Registro de Errores Encontrados (Bug Tracking)
Si un test falla o si el comportamiento en las pruebas de integración/desarrollo no es el esperado, se debe documentar aquí la falla.

### Errores Activos
*Aún no se han registrado errores limitantes.*

### Errores Resueltos (Historial)
1. **(Resuelto)** Configuración Gmail: _Se solucionó pasando parámetros por variables de entorno `$env` en la terminal (04/2026)._
2. **(Resuelto)** Conflicto de Base de Datos: _Se actualizó a `flyway.cleanDisabled=false` y se validó en Aiven cloud (04/2026)._

---

## 🛠️ Plan de Trabajo Próximo
1. Ejecutar las pruebas de `AuthController` para confirmar validación de entorno de testing de Spring.
2. Construir `UserControllerTest.java` (Usuarios con roles `ADMIN`, soft delete).
3. Construir `PolicyControllerTest.java` y validar que el modelado BPMN JSON funcione correctamente.
