import express from 'express';
import cors from 'cors';
import approvalApi from './api/approval-api';
import complianceApi from './api/compliance-api';
import segregationApi from './api/segregation-api';
import taxApi from './api/tax-api';
import monitoringApi from './api/monitoring-api';
import MonitoringMiddleware from './monitoring/monitoring-middleware';
import logger from './monitoring/logger';
import { alertingSystem } from './monitoring/alerting';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Monitoring Middleware
app.use(MonitoringMiddleware.requestTracker());
app.use(MonitoringMiddleware.metricsReporter());
app.use(MonitoringMiddleware.kyc_amlMonitor());
app.use(MonitoringMiddleware.segregationMonitor());
app.use(MonitoringMiddleware.taxMonitor());
app.use(MonitoringMiddleware.integrationMonitor());
app.use(MonitoringMiddleware.securityMonitor());

// Alert Subscribers
alertingSystem.subscribe(async (alert) => {
  await logger.info('alert_triggered', `Alert: ${alert.ruleName}`, {
    alertId: alert.id,
    severity: alert.severity,
    metric: alert.metric,
    value: alert.value,
  });
});

// Rutas API
console.log('✓ Registrando approval-api');
app.use('/', approvalApi);
console.log('✓ Registrando compliance-api');
app.use('/', complianceApi);
console.log('✓ Registrando segregation-api');
app.use('/', segregationApi);
console.log('✓ Registrando tax-api');
app.use('/tax', taxApi);
console.log('✓ Registrando monitoring-api');
app.use('/monitoring', monitoringApi);
console.log('✓ Todas las rutas registradas');

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'Sistema de Aprobación Digital con Firma RSA-2048',
    description: 'Sistema de gobernanza corporativa para SAS con responsabilidad solidaria del Síndico',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      keys: {
        'POST /api/keys/generate': 'Generar claves RSA-2048 para Síndico',
      },
      transactions: {
        'POST /api/transactions/create': 'Crear transacción pendiente (> €100)',
        'GET /api/transactions/pending': 'Obtener transacciones pendientes de aprobación',
        'GET /api/transactions/high-value': 'Obtener transacciones de alto valor',
        'GET /api/transactions/:id': 'Obtener detalles de transacción',
        'POST /api/transactions/:id/approve': 'Aprobar y firmar transacción (Síndico)',
        'POST /api/transactions/:id/reject': 'Rechazar transacción',
        'POST /api/transactions/:id/execute': 'Ejecutar transacción aprobada',
        'POST /api/transactions/:id/verify': 'Verificar firma digital',
      },
      audit: {
        'GET /api/audit/:id': 'Obtener registro de auditoría de transacción',
      },
      compliance: {
        'POST /compliance/kyc/register': 'Registrar cliente con Cédula Ecuador',
        'POST /compliance/kyc/verify/:clientId': 'Verificar KYC del cliente',
        'GET /compliance/client/:clientId': 'Obtener estado completo del cliente',
        'POST /compliance/validate-transaction': 'Validar transacción (AML checks)',
        'GET /compliance/flags/active': 'Obtener flags AML activas',
        'POST /compliance/report-uif/:flagId': 'Reportar a UIF (Inteligencia Financiera)',
      },
      monitoring: {
        'GET /monitoring/metrics': 'Obtener métricas en formato Prometheus',
        'GET /monitoring/metrics/summary': 'Resumen de métricas en JSON',
        'GET /monitoring/health': 'Health check del sistema',
        'GET /monitoring/dashboard': 'Dashboard de monitoreo agregado',
        'GET /monitoring/alerts': 'Obtener lista de alertas',
        'GET /monitoring/alerts/statistics': 'Estadísticas de alertas',
        'POST /monitoring/alerts/:id/acknowledge': 'Reconocer alerta',
        'GET /monitoring/compliance-report': 'Reporte de cumplimiento',
        'GET /monitoring/logs': 'Obtener logs del sistema',
      },
    },
  });
});

// API Documentation
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Sistema de Aprobación Digital - API REST',
    description: 'Documentación completa de endpoints',
    baseUrl: `http://localhost:${PORT}`,
    sections: {
      'Gestión de Claves': {
        'POST /api/keys/generate': {
          description: 'Generar nuevo par de claves RSA-2048 para el Síndico',
          body: {
            keyId: 'sindico-omar-main (opcional)',
          },
          response: {
            keyId: 'string',
            thumbprint: 'string (16 caracteres hex)',
            createdAt: 'ISO timestamp',
            expiresAt: 'ISO timestamp (365 días)',
          },
        },
      },
      'Creación de Transacciones': {
        'POST /api/transactions/create': {
          description: 'Crear nueva transacción que requiere aprobación (montos > €100)',
          minAmount: 100,
          body: {
            amount: 'number (> 100)',
            currency: 'EUR',
            description: 'string',
            signatory: 'string (por defecto: Omar)',
            notes: 'string (opcional)',
          },
          response: {
            transaction: {
              id: 'string',
              transactionId: 'TXN-xxxxxx',
              status: 'PENDING',
              createdAt: 'ISO timestamp',
            },
          },
        },
      },
      'Aprobación y Firma Digital': {
        'POST /api/transactions/:id/approve': {
          description: 'Operación CRÍTICA: Síndico (Omar) aprueba y firma digitalmente',
          requiresAuth: 'Síndico',
          body: {
            keyId: 'sindico-omar-main',
            signatoryId: 'Omar',
          },
          signature: {
            algorithm: 'RSA-SHA256',
            keySize: 2048,
            stored: 'Database + Audit Trail',
          },
          auditTrail: true,
          response: {
            success: true,
            message: 'Transacción aprobada y firmada digitalmente',
            signedTransaction: {
              algorithm: 'RSA-SHA256',
              verified: 'boolean',
            },
            proof: {
              proofHash: 'string (SHA-256)',
              isValid: 'boolean',
            },
          },
        },
      },
      'Ejecución de Transacciones': {
        'POST /api/transactions/:id/execute': {
          description: 'Ejecutar transacción aprobada y verificar firma',
          requirements: [
            'Estado = APPROVED',
            'Firma válida y verificada',
            'Firma de Síndico válida',
          ],
          verification: 'RSA-SHA256 verification',
          response: {
            success: true,
            transaction: {
              status: 'EXECUTED',
              signatureVerified: true,
            },
          },
        },
      },
      'Auditoría': {
        'GET /api/audit/:id': {
          description: 'Obtener registro completo de auditoría de una transacción',
          response: {
            auditLog: [
              {
                action: 'CREATED | SIGNED | EXECUTED | REJECTED',
                actor: 'string',
                timestamp: 'ISO timestamp',
                details: 'string',
              },
            ],
          },
        },
      },
    },
    legalFramework: {
      responsibilidad: 'Síndico (Omar) + SAS responden solidariamente',
      threshold: '€100 - Transacciones mayores requieren firma digital',
      signature: 'RSA-2048 (2048 bits)',
      algorithm: 'RSA-SHA256',
      auditTrail: 'Completo e inmutable',
      nonRepudiation: 'Digitalmente verificable',
    },
  });
});

// Error handling with monitoring
app.use(MonitoringMiddleware.errorHandler());

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Sistema de Aprobación Digital con Firma RSA-2048         ║
║  Gobernanza Corporativa - SAS                             ║
║  + Monitoreo & Observabilidad en Tiempo Real              ║
╚════════════════════════════════════════════════════════════╝

✓ Servidor iniciado en puerto ${PORT}
✓ Endpoints disponibles:
  - http://localhost:${PORT}/
  - http://localhost:${PORT}/api-docs
  - http://localhost:${PORT}/monitoring/health
  - http://localhost:${PORT}/monitoring/dashboard
  - http://localhost:${PORT}/monitoring/metrics
  - http://localhost:${PORT}/monitoring/alerts
  - http://localhost:${PORT}/monitoring/compliance-report

✓ Características:
  - Firma RSA-2048 (2048 bits)
  - Aprobación de transacciones > €100
  - Responsabilidad solidaria: Síndico (Omar) + SAS
  - Registro de auditoría inmutable
  - Verificación criptográfica

✓ Monitoreo & Observabilidad:
  - Recolección de métricas Prometheus
  - Sistema de alertas en tiempo real (10 reglas predefinidas)
  - Logging centralizado con trazas distribuidas
  - Dashboard de cumplimiento regulatorio
  - Reportes de alertas y compliance

✓ Base de datos: SQLite (transactions.db)
✓ Claves: Almacenadas en ./keys/
✓ Logs: Almacenados en ./logs/
  `);

  await logger.info('server_startup', 'Sistema completamente iniciado');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📛 SIGTERM recibido, cerrando servidor...');
  await logger.info('server_shutdown', 'SIGTERM recibido');
  server.close(async () => {
    await logger.shutdown();
    process.exit(0);
  });
});

export default app;
