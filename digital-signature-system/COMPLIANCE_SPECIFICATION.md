# 🔐 Sistema de Aprobación Digital con Firma RSA-2048
## Especificación Técnica Completa - KYC/AML + Gobernanza

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulo KYC/AML](#módulo-kycaml)
4. [APIs REST Disponibles](#apis-rest-disponibles)
5. [Flujos de Operación](#flujos-de-operación)
6. [Modelos de Datos](#modelos-de-datos)
7. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
8. [Requisitos de Cumplimiento](#requisitos-de-cumplimiento)

---

## 🎯 Descripción General

Sistema de gobernanza corporativa para Sociedades Anónimas Simplificadas (SAS) que implementa:

- **Firma Digital RSA-2048**: Non-repudiation y responsabilidad solidaria del Síndico (Omar)
- **KYC Compliance**: Verificación de identidad con Cédula Ecuador (10 dígitos)
- **AML Enforcement**: Detección automática de patrones sospechosos
- **Auditoría Inmutable**: Registro completo de todas las transacciones
- **Gobernanza de Umbrales**: Transacciones > €100 requieren aprobación

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS.JS SERVER                      │
│                    (Puerto 3001)                         │
└─────────────────────────────────────────────────────────┘
           ↓                          ↓
    ┌──────────────┐         ┌────────────────┐
    │ Approval API │         │ Compliance API │
    │ (9 endpoints)│         │ (6 endpoints)  │
    └──────────────┘         └────────────────┘
           ↓                          ↓
    ┌──────────────┐         ┌────────────────┐
    │   RSA-2048   │         │ KYCManager +   │
    │   Signatures │         │ AMLEngine      │
    └──────────────┘         └────────────────┘
           ↓                          ↓
    ┌─────────────────────────────────────┐
    │     SQLite3 Database (Persistent)    │
    │  • transactions                      │
    │  • audit_log                         │
    │  • clients                           │
    │  • aml_flags                         │
    └─────────────────────────────────────┘
```

---

## 🔐 Módulo KYC/AML

### KYCManager Class

**Responsabilidad**: Gestión de identidad de clientes y verificación KYC

#### Métodos Principales

**verifyIdentity(cedula, fullName): boolean**
- Valida Cédula Ecuador (10 dígitos)
- Calcula dígito verificador según algoritmo ecuatoriano
- En producción: conectar con API de SENESCYT
- Garantiza: NO se procesan clientes sin cédula válida

**registerClient(...): Client**
- Crea perfil de cliente con estado PENDING
- Risk Score inicial: 50 (neutral)
- Genera ID único: `CLI-{timestamp}-{hex}`
- Retorna: Client object con campos inmutables

**markKYCVerified(clientId): Client | null**
- Cambia estado a VERIFIED
- Reduce Risk Score por 20 puntos
- Registra verifiedAt timestamp
- Permite transacciones de alto monto

#### Estados de Cliente

| Estado | Descripción | Puede Transaccionar |
|--------|-------------|-------------------|
| PENDING | Cédula registrada, espera verificación | ❌ Bloqueado |
| VERIFIED | KYC completado, identidad confirmada | ✅ Sí |
| REJECTED | Falló verificación de identidad | ❌ Permanentemente bloqueado |
| FLAGGED | AML marcó como sospechoso | ❌ Bloqueado |

### AMLEngine Class

**Responsabilidad**: Detección de patrones sospechosos y validación

#### Detector 1: SPIKE_DETECTION

```
Lógica: Transacción > 3x promedio histórico del cliente
Trigger: Primera transacción o después de 3+ históricas
Severidad:
  • 1.0-1.5x: LOW (risk +5)
  • 1.5-2.0x: MEDIUM (risk +15)
  • 2.0-3.0x: HIGH (risk +30)
  • 3.0+x:    CRITICAL (risk +50, BLOQUEA)

Ejemplo:
  Cliente promedio: €100/tx
  Nueva tx: €350
  Ratio: 3.5x → CRITICAL ⚠️
```

#### Detector 2: CIRCULAR_FLOW

```
Lógica: A → B → A en < 24 horas
Patrón: Layering (lavado de dinero)
Severidad: HIGH (siempre sospechoso)
Acción: BLOQUEADA inmediatamente

Ejemplo:
  Hora 10:00 - Juan envía €5000 → María
  Hora 15:00 - María envía €5000 → Juan
  Resultado: ❌ CIRCULAR_FLOW DETECTADO
```

#### Detector 3: STRUCTURING

```
Lógica: 5+ transacciones ≤ €100 en 24 horas
Patrón: Estructuración (evadir límites de reporte)
Severidad: HIGH (intento de fraude)
Acción: FLAGGED + MONITOR + UIF REPORT

Ejemplo:
  06:00 - Tx 1: €99
  08:00 - Tx 2: €99
  10:00 - Tx 3: €100
  12:00 - Tx 4: €99
  14:00 - Tx 5: €100
  → Tx total: €497
  Resultado: ❌ STRUCTURING DETECTADO
```

#### Cálculo de Risk Score

```typescript
score = baseline (KYC status)
        + (número de flags activos × severidad)
        - (bonus si KYC verificado)

Rango: 0-100
  0-40:   ✅ Bajo riesgo (APROBADA)
  40-70:  ⚠️ Riesgo medio (VERIFICAR)
  70-85:  🚨 Riesgo alto (BLOQUEAR si KYC no verificado)
  85+:    🛑 Riesgo crítico (SIEMPRE BLOQUEAR)
```

#### Lógica de Bloqueo

```
ShouldBlockTransaction = TRUE si:
  1. KYC ≠ VERIFIED AND riskScore > 70
  2. amlStatus = BLOCKED
  3. riskScore > 85
  4. Circular flow detectado
  5. Structuring detectado
```

#### UIF Reporting

```
Triggered cuando:
  • Severity = CRITICAL
  • Risk Score > 85
  • Circular flow o structuring detectados

Información reportada:
  {
    clientId,
    cedula,
    reason,
    timestamp,
    severity,
    transaction_details
  }

En producción: Enviar a API de UIF (Unidad de Inteligencia Financiera)
```

---

## 🔌 APIs REST Disponibles

### BLOQUE 1: Gestión de Clientes KYC

#### Endpoint 1.1: Registrar Cliente
```http
POST /compliance/kyc/register
Content-Type: application/json

{
  "cedula": "1712345678",
  "fullName": "Juan García López",
  "email": "juan@example.com",
  "phone": "+593991234567",
  "address": "Quito, Ecuador"
}

Respuesta (201):
{
  "success": true,
  "message": "Cliente registrado. KYC pendiente de verificación.",
  "client": {
    "id": "CLI-1789219262592-439507C9",
    "cedula": "1712345678",
    "fullName": "Juan García López",
    "kycStatus": "PENDING",
    "amlStatus": "CLEAN",
    "riskScore": 50
  }
}

Errores:
  400: Cédula inválida / formato incorrecto
  400: Cliente ya registrado
  500: Error del servidor
```

#### Endpoint 1.2: Verificar KYC
```http
POST /compliance/kyc/verify/:clientId

Respuesta (200):
{
  "success": true,
  "message": "KYC verificado exitosamente",
  "client": {
    "id": "CLI-1789219262592-439507C9",
    "cedula": "1712345678",
    "fullName": "Juan García López",
    "kycStatus": "VERIFIED",
    "verifiedAt": "2026-09-12T13:22:00.000Z",
    "riskScore": 30
  }
}
```

#### Endpoint 1.3: Obtener Estado del Cliente
```http
GET /compliance/client/:clientId

Respuesta (200):
{
  "success": true,
  "client": {
    "id": "CLI-...",
    "cedula": "1712345678",
    "fullName": "Juan García López",
    "kycStatus": "VERIFIED",
    "amlStatus": "CLEAN",
    "riskScore": 30,
    "flagCount": 0,
    "activeFlags": 0
  },
  "flags": [
    {
      "id": "FLAG-SPIKE-...",
      "type": "SPIKE_DETECTION",
      "description": "Transacción inusualmente alta...",
      "severity": "MEDIUM",
      "status": "OPEN",
      "flaggedAt": "2026-09-12T13:22:00.000Z"
    }
  ]
}
```

### BLOQUE 2: Validación de Transacciones

#### Endpoint 2.1: Validar Transacción (AML Checks)
```http
POST /compliance/validate-transaction
Content-Type: application/json

{
  "clientId": "CLI-1789219262592-439507C9",
  "amount": 5000,
  "description": "Pago a proveedor",
  "recipientId": "CLI-...",
  "recentTransactions": [...]
}

Respuesta (200):
{
  "success": true,
  "canProceed": true,
  "blockReason": null,
  "riskScore": 35,
  "violations": [
    {
      "type": "SPIKE_DETECTION",
      "severity": "MEDIUM",
      "description": "Transacción inusualmente alta: €5000",
      "canProceed": true
    }
  ],
  "compliance": {
    "kycStatus": "VERIFIED",
    "amlStatus": "CLEAN",
    "flagCount": 1
  }
}
```

### BLOQUE 3: Gestión de Flags

#### Endpoint 3.1: Obtener Flags Activas
```http
GET /compliance/flags/active

Respuesta (200):
{
  "success": true,
  "totalActiveFlags": 2,
  "flags": [
    {
      "id": "FLAG-SPIKE-1789219270000",
      "clientId": "CLI-...",
      "type": "SPIKE_DETECTION",
      "description": "Transacción inusualmente alta: €7500",
      "severity": "HIGH",
      "status": "OPEN",
      "flaggedAt": "2026-09-12T13:22:00.000Z"
    }
  ]
}
```

#### Endpoint 3.2: Reportar a UIF
```http
POST /compliance/report-uif/:flagId
Content-Type: application/json

{
  "clientId": "CLI-...",
  "reason": "Actividad sospechosa de estructuración detectada"
}

Respuesta (200):
{
  "success": true,
  "message": "🚨 Reporte UIF enviado exitosamente",
  "flag": {
    "id": "FLAG-STRUCTURING-...",
    "status": "REPORTED_UIF",
    "reportedToUIF": "2026-09-12T13:22:00.000Z"
  }
}
```

### BLOQUE 4: Transacciones (Approval API)

#### Endpoint 4.1: Crear Transacción
```http
POST /api/transactions/create
Content-Type: application/json

{
  "amount": 5000,
  "currency": "EUR",
  "description": "Pago a proveedor",
  "signatory": "Omar",
  "notes": "Aprobado por Junta Directiva"
}

Nota: Solo aceptada si amount > €100
```

#### Endpoint 4.2: Aprobar y Firmar (Síndico)
```http
POST /api/transactions/:id/approve
Content-Type: application/json

{
  "keyId": "sindico-omar-main",
  "signatoryId": "Omar"
}

Respuesta: Transacción firmada con RSA-2048
```

#### Endpoint 4.3: Ejecutar Transacción
```http
POST /api/transactions/:id/execute

Requisitos:
  • Estado = APPROVED
  • Firma válida y verificada
  • KYC verificado si es monto alto
  • Risk score < 85

Resultado: Status = EXECUTED
```

---

## 🔄 Flujos de Operación

### Flujo 1: Onboarding de Cliente

```
┌─ START: Cliente nuevo
│
├─ [1] POST /compliance/kyc/register
│      Input: Cédula Ecuador + datos personales
│      Validación: Formato cédula + dígito verificador
│      Output: Cliente con estado PENDING
│
├─ [2] POST /compliance/kyc/verify/:clientId
│      En producción: Validar contra SENESCYT
│      Output: Cliente con estado VERIFIED
│      Risk Score: -20 puntos
│
└─ END: Cliente verificado, listo para transacciones
```

### Flujo 2: Transacción > €100

```
┌─ Síndico prepara transacción
│
├─ [1] POST /api/transactions/create
│      Monto: €5000 (> €100)
│      Output: Tx status = PENDING
│
├─ [2] POST /compliance/validate-transaction
│      AML Checks:
│        • SPIKE: 3x promedio?
│        • CIRCULAR: A→B→A?
│        • STRUCTURING: 5+ pequeñas?
│      Output: canProceed = true/false
│
├─ [3] POST /api/transactions/:id/approve
│      Síndico Omar firma con RSA-2048
│      Output: Status = APPROVED
│      Firma almacenada en BD
│
├─ [4] POST /api/transactions/:id/execute
│      Verificar firma digitalmente
│      Output: Status = EXECUTED
│      Auditoría registrada
│
└─ END: Transacción completada + no repudiable
```

### Flujo 3: Detección de Fraude

```
┌─ Cliente sospechoso realiza transacción
│
├─ AMLEngine detecta patrón
│   (SPIKE > CRITICAL, CIRCULAR o STRUCTURING)
│
├─ [1] Flag creado con severity HIGH/CRITICAL
│
├─ [2] Risk score recalculado
│      Score > 85? → ShouldBlockTransaction = TRUE
│
├─ [3] Transacción BLOQUEADA automáticamente
│
├─ [4] Flag = REPORTED_UIF
│      Enviar a UIF si CRITICAL
│
└─ END: Fraude prevenido, UIF informada
```

---

## 📊 Modelos de Datos

### Tabla: clients

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  fullName TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  kycStatus TEXT NOT NULL CHECK(kycStatus IN ('PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED')),
  amlStatus TEXT NOT NULL CHECK(amlStatus IN ('CLEAN', 'FLAGGED', 'BLOCKED', 'REPORTED')),
  riskScore INTEGER DEFAULT 50,
  verifiedAt DATETIME,
  createdAt DATETIME NOT NULL,
  lastActivityAt DATETIME,
  transactionCount INTEGER DEFAULT 0,
  totalVolume DECIMAL(12,2) DEFAULT 0,
  averageTransaction DECIMAL(10,2) DEFAULT 0
);
```

### Tabla: aml_flags

```sql
CREATE TABLE aml_flags (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL REFERENCES clients(id),
  type TEXT NOT NULL CHECK(type IN ('SPIKE_DETECTION', 'CIRCULAR_FLOW', 'STRUCTURING', 'SUSPICIOUS_PATTERN', 'VELOCITY')),
  description TEXT,
  flaggedAmount DECIMAL(10,2),
  severity TEXT NOT NULL CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL CHECK(status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REPORTED_UIF')),
  flaggedAt DATETIME NOT NULL,
  reportedToUIF DATETIME,
  INDEX idx_clientId (clientId),
  INDEX idx_status (status)
);
```

### Tabla: transactions (existente + AML fields)

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  transactionId TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
  currency TEXT NOT NULL,
  description TEXT,
  signatory TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  signature TEXT,
  kycVerified BOOLEAN DEFAULT 0,
  amlApproved BOOLEAN DEFAULT 0,
  riskScoreAtApproval INTEGER,
  createdAt DATETIME NOT NULL,
  approvedAt DATETIME,
  executedAt DATETIME,
  notes TEXT
);
```

---

## 🔒 Consideraciones de Seguridad

### 1. Criptografía RSA-2048

- **Tamaño**: 2048 bits (nivel NIST 112-bit)
- **Algoritmo**: RSA-SHA256
- **Formato privada**: PKCS#8 (encriptable con contraseña)
- **Formato pública**: SPKI (para distribución)
- **Non-repudiation**: Imposible negar firma una vez creada
- **Validez**: 365 días máximo

### 2. Protección de Base de Datos

- **Transacciones**: SQLite3 con ACID compliance
- **Audit trail**: Inmutable después de crearse
- **Checksums**: SHA-256 para integridad
- **Validación**: Constraints CHECK en nivel BD
- **Índices**: Optimizados para queries frecuentes

### 3. Validación de Identidad

- **Cédula Ecuador**: Validación local de formato + dígito verificador
- **En producción**: Integrar API SENESCYT para verificación real
- **Verificación dual**: Cédula + nombre + datos personales
- **Rastreo**: Imposible registrar dos clientes con misma cédula

### 4. Prevención de Fraude

- **AML Checks**: Ejecutan ANTES de aprobar
- **Risk Scoring**: Dinámico basado en historial
- **Patrones**: Spike + Circular + Structuring
- **Bloqueos**: Automáticos si supera umbrales
- **UIF Reporting**: Para casos CRÍTICOS

### 5. Auditoría

- **Completo**: Toda acción registrada
- **Inmutable**: No se puede borrar o modificar
- **Trazable**: Quién, qué, cuándo, por qué
- **Non-repudiation**: Prueba criptográfica de acción
- **Archivo**: Permanente en BD

---

## ✅ Requisitos de Cumplimiento

| Requisito | Implementado | Descripción |
|-----------|:------------:|------------|
| KYC Verificación | ✅ | Cédula Ecuador con dígito verificador |
| Identidad Confirmada | ✅ | Cliente solo puede transaccionar si KYC = VERIFIED |
| Spike Detection | ✅ | Flagged si tx > 3x promedio |
| Circular Flows | ✅ | Bloqueado si A→B→A < 24h |
| Structuring Detection | ✅ | Flagged si 5+ tx ≤ €100 / 24h |
| Risk Scoring | ✅ | 0-100 escala dinámica |
| AML Blocking | ✅ | Automático si score > 85 o patrón crítico |
| UIF Reporting | ✅ | Reporte cuando CRITICAL detectado |
| RSA-2048 Signing | ✅ | Non-repudiation garantizado |
| Audit Trails | ✅ | Inmutable + completo |
| Threshold Governance | ✅ | €100 mínimo para firma requerida |
| Solidaria Liability | ✅ | Síndico + SAS responsables solidariamente |

---

## 🚀 Próximos Pasos (Producción)

- [ ] Integrar con API de SENESCYT para verificación real de Cédulas
- [ ] Conectar con API de UIF para reportes automáticos
- [ ] Migrar de SQLite a PostgreSQL para escalabilidad
- [ ] Implementar 2FA para aprobaciones de Síndico
- [ ] Agregar encriptación en reposo para bases de datos
- [ ] Auditoría externa de código criptográfico
- [ ] Certificados SSL/TLS para comunicaciones
- [ ] Rate limiting y protección DDoS
- [ ] Logging centralizado con SIEM
- [ ] Backup automático y disaster recovery

---

**Última actualización**: 2026-09-12  
**Versión**: 1.0 - MVP Completo  
**Status**: ✅ Operativo
