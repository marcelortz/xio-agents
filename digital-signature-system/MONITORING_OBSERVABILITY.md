# 🔍 Monitoreo & Observabilidad - Sistema de Gobernanza Corporativa

**Status**: Production Ready  
**Date**: 2026-09-12  
**Components**: 4 (Metrics, Logs, Alerts, Tracing)

---

## Resumen Ejecutivo

Sistema completo de monitoreo y observabilidad para el sistema de gobernanza corporativa SAS Ecuador con:

✅ **Recolección de Métricas**: 40+ métricas Prometheus en tiempo real  
✅ **Logging Centralizado**: Trazas distribuidas con traceId/spanId  
✅ **Alertas Inteligentes**: 10 reglas predefinidas + alertas personalizadas  
✅ **Dashboard Unificado**: Vista agregada de compliance + seguridad  
✅ **Cumplimiento**: Reporte automático de métricas regulatorias  

---

## 1. Recolección de Métricas

### Sistema de Métricas Prometheus

**Ubicación**: `src/monitoring/metrics-collector.ts`

#### Métricas HTTP
```typescript
- http_request_duration_seconds: Duración de requests (buckets: 0.1-5s)
- http_requests_total: Total de requests por endpoint/método/status
- http_request_size_bytes: Tamaño de requests (buckets: 100B-100KB)
- http_response_size_bytes: Tamaño de responses
```

#### Métricas KYC/AML
```typescript
- kyc_verifications_total: Total de verificaciones KYC
- aml_checks_failed_total: Total de fallos en checks AML
- risky_clients: Gauge de clientes de alto riesgo
- aml_flags_created_total: Flags de AML por tipo y severidad
```

#### Métricas Segregación
```typescript
- accounts_created_total: Cuentas segregadas creadas
- transactions_recorded_total: Transacciones grabadas
- total_aum_euros: Total Assets Under Management
- guarantee_fund_euros: Fondo de garantía 5% AUM
```

#### Métricas Impuestos
```typescript
- tax_reports_generated_total: Reportes de impuestos generados
- tax_reports_submitted_total: Reportes enviados a SRI
- total_iva_filed_euros: Total IVA reportado
- total_retentions_filed_euros: Total retenciones reportadas
```

#### Métricas Integraciones
```typescript
- integration_api_calls_total: Llamadas a APIs externas
- integration_api_errors_total: Errores en integraciones
- integration_api_duration_seconds: Duración de llamadas API
```

#### Métricas Sistema
```typescript
- active_connections: Conexiones activas
- database_connections: Conexiones a DB
- process_uptime_seconds: Uptime del proceso
- memory_usage_bytes: Uso de memoria
- cpu_usage_percent: Uso de CPU
```

#### Métricas Seguridad
```typescript
- failed_authentications_total: Intentos de auth fallidos
- unauthorized_access_total: Intentos de acceso no autorizado
- suspicious_activities_total: Actividades sospechosas detectadas
```

### Acceso a Métricas

**Prometheus Format** (compatible con Grafana, Prometheus, etc):
```bash
GET /monitoring/metrics
```

**JSON Summary**:
```bash
GET /monitoring/metrics/summary
```

---

## 2. Logging Centralizado con Trazas Distribuidas

### Sistema de Logger

**Ubicación**: `src/monitoring/logger.ts`

#### Características

✅ **Trazas Distribuidas**: Cada log contiene:
   - `traceId`: ID único de la taza (persiste entre servicios)
   - `spanId`: Operación específica dentro de la taza
   - `timestamp`: ISO 8601 con precisión ms
   - `service`: Identificador del servicio
   - `operation`: Operación específica

✅ **Múltiples Niveles**:
   - `TRACE`: Ejecución detallada (en spanStart)
   - `DEBUG`: Información de debug
   - `INFO`: Información general
   - `WARN`: Advertencias
   - `ERROR`: Errores

✅ **Múltiples Transports**:
   - Console (con colores)
   - File (rotación automática)
   - Remote (opcional)

### Uso Básico

```typescript
import logger from './monitoring/logger';

// Log simple
await logger.info('payment_processed', 'Payment completed', {
  amount: 5000,
  clientId: 'CLI-123'
});

// Log con errores
try {
  // operación
} catch (error) {
  await logger.error('payment_failed', 'Payment processing failed', error, {
    amount: 5000,
    clientId: 'CLI-123'
  });
}

// Span con contexto de traza
await logger.startSpan('kyc_verification', async (context) => {
  await logger.info('kyc_check', 'Validando Cédula', {
    traceId: context.traceId,
    cedula: '1723456789'
  });
  // operaciones
});
```

### Archivos de Log

```
logs/
├── trace-2026-09-12.log    # Trazas de ejecución
├── debug-2026-09-12.log    # Información de debug
├── info-2026-09-12.log     # Logs informativos
├── warn-2026-09-12.log     # Advertencias
└── error-2026-09-12.log    # Errores
```

### Acceso a Logs

```bash
# Últimos 100 logs
GET /monitoring/logs?limit=100

# Logs de una fecha específica
GET /monitoring/logs?date=2026-09-12
```

---

## 3. Sistema de Alertas Inteligentes

### Rutas Predefinidas

**Ubicación**: `src/monitoring/alerting.ts`

| ID | Nombre | Condición | Severidad | Cooldown |
|----|--------|-----------|-----------|----------|
| `high_risk_clients` | Clientes de Alto Riesgo | > 10 | MEDIUM | 5 min |
| `aml_check_failures` | Fallos AML | > 5 | HIGH | 5 min |
| `failed_authentications` | Auth Fallida | > 10 | HIGH | 10 min |
| `unauthorized_access` | Acceso No Autorizado | > 5 | CRITICAL | 10 min |
| `integration_errors` | Errores Integración | > 3 | MEDIUM | 5 min |
| `database_connection_pool` | Pool DB Bajo | < 2 | HIGH | 10 min |
| `memory_usage` | Uso Memoria Alto | > 800MB | MEDIUM | 15 min |
| `cpu_usage` | Uso CPU Alto | > 80% | MEDIUM | 10 min |
| `tax_submission_failures` | Fallos Impuestos | > 2 | CRITICAL | 10 min |
| `suspicious_activities` | Actividades Sospechosas | > 3 | CRITICAL | 5 min |

### Severidades

```
LOW:      Problemas menores, revisar cuando sea posible
MEDIUM:   Requiere atención dentro de 1 hora
HIGH:     Requiere atención inmediata
CRITICAL: Requiere acción inmediata
```

### Endpoints de Alertas

```bash
# Listar todas las alertas
GET /monitoring/alerts

# Alertas activas (no reconocidas)
GET /monitoring/alerts?filter=active

# Detalles de alerta específica
GET /monitoring/alerts/{alertId}

# Reconocer alerta
POST /monitoring/alerts/{alertId}/acknowledge

# Estadísticas de alertas
GET /monitoring/alerts/statistics

# Listar reglas
GET /monitoring/alerts/rules

# Habilitar/Deshabilitar regla
POST /monitoring/alerts/rules/{ruleId}/enable
POST /monitoring/alerts/rules/{ruleId}/disable
```

### Ejemplos de Respuesta

```json
{
  "id": "alert-1694515200000-ABC123",
  "ruleId": "high_risk_clients",
  "ruleName": "High Risk Clients Alert",
  "severity": "MEDIUM",
  "metric": "risky_clients",
  "value": 12,
  "threshold": 10,
  "timestamp": "2026-09-12T15:30:00.000Z",
  "message": "High Risk Clients Alert: risky_clients = 12 (threshold: 10)",
  "acknowledged": false
}
```

---

## 4. Middleware de Monitoreo

### Integración Automática

**Ubicación**: `src/monitoring/monitoring-middleware.ts`

Middleware que se ejecuta automáticamente en cada request:

✅ **Rastreo de Requests**: Asigna traceId/spanId a cada request  
✅ **Métricas HTTP**: Duración, tamaño, status  
✅ **Monitoreo Específico**: KYC/AML, Segregación, Impuestos, Integraciones  
✅ **Alertas Automáticas**: Dispara alertas basadas en condiciones  
✅ **Errores**: Captura y registra errores con contexto completo  

---

## 5. Dashboard Unificado

### Endpoint Principal

```bash
GET /monitoring/dashboard
```

**Retorna**:
```json
{
  "timestamp": "2026-09-12T15:30:00.000Z",
  "uptime": 3600,
  "memory": { "heapUsed": 42000000, "heapTotal": 67000000 },
  "cpu": { "user": 1000000, "system": 500000 },
  "metrics": {
    "http": { "totalRequests": 1250, "avgResponseTime": 125 },
    "kyc": { "totalVerifications": 45, "failedChecks": 2, "riskyClients": 5 },
    "segregation": { "accountsCreated": 23, "transactionsRecorded": 182, "totalAUM": 250000 },
    "tax": { "reportsGenerated": 45, "reportsSubmitted": 43 }
  },
  "alerts": {
    "totalAlerts": 8,
    "activeAlerts": 2,
    "bySeverity": { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 1, "LOW": 0 }
  }
}
```

---

## 6. Reporte de Cumplimiento

### Endpoint Compliance

```bash
GET /monitoring/compliance-report
```

**Retorna**:
```json
{
  "timestamp": "2026-09-12T15:30:00.000Z",
  "compliance": {
    "kyc": {
      "totalVerifications": 45,
      "failedChecks": 2,
      "riskyClients": 5
    },
    "segregation": {
      "accountsCreated": 23,
      "transactionsRecorded": 182,
      "totalAUM": 250000,
      "guaranteeFund": 12500
    },
    "tax": {
      "reportsGenerated": 45,
      "reportsSubmitted": 43
    },
    "security": {
      "failedAuthentications": 3,
      "unauthorizedAccessAttempts": 0,
      "suspiciousActivities": 1
    }
  },
  "alerts": {
    "totalAlerts": 8,
    "activeAlerts": 2,
    "bySeverity": {
      "CRITICAL": 0,
      "HIGH": 1,
      "MEDIUM": 1,
      "LOW": 0
    }
  }
}
```

---

## 7. Health Check

### Endpoint Health

```bash
GET /monitoring/health
```

**Respuesta Healthy**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-12T15:30:00.000Z",
  "uptime": 3600,
  "memory": { "heapUsed": 42000000, "heapTotal": 67000000 },
  "metrics": {
    "activeAlerts": 2,
    "totalMetrics": 40
  }
}
```

**Respuesta Unhealthy** (503):
```json
{
  "status": "unhealthy",
  "error": "High memory usage detected"
}
```

---

## 8. Configuración

### Environment Variables

```env
# Logging
LOG_LEVEL=info              # trace, debug, info, warn, error
LOG_DIR=./logs
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_ENABLE_REMOTE=false
LOG_REMOTE_URL=http://logs.example.com

# Metrics
METRICS_ENABLE=true
METRICS_EXPORT_INTERVAL=60000  # 60 segundos

# Alerts
ALERTS_ENABLE=true
ALERTS_COOLDOWN=300000         # 5 minutos entre alertas del mismo tipo
```

---

## 9. Integración con Grafana

### Prometheus as Data Source

1. **Configurar Prometheus** para scrape métricas:
```yaml
scrape_configs:
  - job_name: 'governance-system'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/monitoring/metrics'
```

2. **Agregar en Grafana**:
   - Data Source: Prometheus (localhost:9090)
   - Dashboards: Crear usando métricas disponibles

### Ejemplo de Query

```prometheus
# Latencia P95 de requests
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Tasa de error HTTP
rate(http_requests_total{status=~"5.."}[5m])

# Clientes de alto riesgo
risky_clients

# AML checks fallidos por hora
rate(aml_checks_failed_total[1h])
```

---

## 10. Alertas en Tiempo Real

### Suscriptores Personalizados

```typescript
import { alertingSystem } from './monitoring/alerting';

// Suscribirse a alertas
alertingSystem.subscribe(async (alert) => {
  if (alert.severity === 'CRITICAL') {
    // Enviar email, SMS, Slack, PagerDuty
    await notificationService.sendAlert(alert);
  }
});
```

---

## 11. Mejores Prácticas

### Logging
✅ Siempre incluir traceId para correlacionar requests  
✅ Usar niveles apropiados (DEBUG ≠ ERROR)  
✅ Incluir contexto relevante en cada log  
✅ No registrar datos sensibles (contraseñas, tokens)  

### Métricas
✅ Usar nombres consistentes  
✅ Agregar labels descriptivos  
✅ Revisar alertas regularmente  
✅ Establecer baselines correctas  

### Alertas
✅ Configurar cooldown apropiado para evitar spam  
✅ Revisar y reconocer alertas activas  
✅ Investigar patrones de alertas  
✅ Ajustar umbrales según tendencias  

---

## 12. Checklist de Producción

- [ ] Logger configurado y probado
- [ ] Métricas expuestas en `/monitoring/metrics`
- [ ] Alertas habilitadas (al menos 5 reglas críticas)
- [ ] Dashboard de Grafana configurado
- [ ] Logs rotando automáticamente
- [ ] Almacenamiento de logs con suficiente espacio
- [ ] Backups de logs configurados
- [ ] Notificaciones de alertas críticas configuradas
- [ ] Reportes de compliance programados
- [ ] Equipo entrenado en interpretación de métricas

---

## 13. Troubleshooting

### Logs no aparecen
1. Verificar permisos en `./logs/`
2. Revisar configuración `LOG_DIR`
3. Verificar nivel de log: `LOG_LEVEL=debug`

### Alertas no se disparan
1. Verificar que la alerta esté habilitada
2. Revisar cooldown del período
3. Revisar condición vs métrica actual

### Altos requisitos de memoria
1. Revisar tamaño del buffer de logs
2. Aumentar limpieza de alertas antiguas
3. Verificar memory leaks en middleware

---

**Status**: ✅ **READY FOR PRODUCTION**

Monitoreo completo e integrado en todos los sistemas.
