# Sistema de Aprobación Digital con Firma RSA-2048 🔐

**Gobernanza Corporativa para SAS - Responsabilidad Solidaria del Síndico (Omar)**

## 📋 Descripción

Sistema integral de aprobación digital y firma criptográfica para transacciones empresariales en una Sociedad por Acciones Simplificada (SAS), donde:

- **El Síndico (Omar)** es responsable de aprobar y firmar digitalmente transacciones > €100
- **Responsabilidad Solidaria**: El Síndico + la SAS responden conjuntamente
- **Firma RSA-2048** con algoritmo SHA-256 para no repudio
- **Auditoría Inmutable**: Registro criptográfico de todas las operaciones
- **Verificación Criptográfica**: Validación de integridad en cada ejecución

---

## 🔐 Especificaciones Criptográficas

| Componente | Especificación |
|-----------|-----------------|
| **Algoritmo de Cifrado** | RSA (Rivest-Shamir-Adleman) |
| **Tamaño de Clave** | 2048 bits (256 bytes) |
| **Función Hash** | SHA-256 |
| **Algoritmo de Firma** | RSA-SHA256 |
| **Estándar de Clave Privada** | PKCS#8 |
| **Estándar de Clave Pública** | SPKI |
| **Validez de Clave** | 365 días |

---

## 🏛️ Marco Legal y Responsabilidad

### Antes vs. Después

❌ **ANTES**: "¿Quién es responsable si el agente comete fraude?"
- Ambigüedad legal
- Responsabilidad sin pruebas
- Denegación plausible

✅ **AHORA**: "El SÍNDICO (Omar) + la SAS responden solidariamente"
- Responsabilidad clara y codificada
- Prueba criptográfica en cada transacción
- No repudio verificable

### Implementación Legal

1. **Síndico aprueba digitalmente CADA transacción > €100**
2. **Firma RSA-2048 en cada operación** (imposible falsificar sin clave privada)
3. **Responsabilidad legal clara en Estatutos de la SAS**
4. **Registro de auditoría inmutable** como evidencia en caso de litigio

---

## 🚀 Instalación

### Requisitos
- Node.js 16+
- npm o yarn
- SQLite3

### Pasos

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd digital-signature-system

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Generar claves RSA-2048 para Síndico (Omar)
npm run generate-keys

# 5. Iniciar servidor
npm run dev
```

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│         API REST (Express.js - Puerto 3001)         │
├─────────────────────────────────────────────────────┤
│  - POST /api/transactions/create                    │
│  - POST /api/transactions/:id/approve (CRÍTICO)     │
│  - POST /api/transactions/:id/execute               │
│  - GET /api/audit/:id                               │
├─────────────────────────────────────────────────────┤
│  Capa de Firma Digital (RSA-2048)                   │
│  - DigitalSignatureManager                          │
│  - RSAKeyManager                                    │
├─────────────────────────────────────────────────────┤
│  Base de Datos SQLite                               │
│  - Tabla: transactions                              │
│  - Tabla: audit_log                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Aprobación

### Paso 1: Crear Transacción
```bash
POST /api/transactions/create
{
  "amount": 5000,
  "currency": "EUR",
  "description": "Pago a proveedor",
  "signatory": "Omar"
}
```
**Resultado**: Transacción creada con estado `PENDING`

### Paso 2: Síndico Aprueba y Firma
```bash
POST /api/transactions/{id}/approve
{
  "keyId": "sindico-omar-main",
  "signatoryId": "Omar"
}
```
**Resultado**: 
- Firma digital RSA-2048 generada
- Estado cambia a `APPROVED`
- Prueba criptográfica creada
- Entrada en auditoría registrada

### Paso 3: Ejecutar Transacción
```bash
POST /api/transactions/{id}/execute
```
**Verificaciones**:
- ✓ Estado = APPROVED
- ✓ Firma válida (verifica RSA-2048)
- ✓ Integridad de datos confirmada
- ✓ No ha expirado

**Resultado**: Estado cambia a `EXECUTED`

### Paso 4: Auditoría
```bash
GET /api/audit/{id}
```
**Retorna**: 
- Historial completo de cambios
- Timestamps
- Actor responsable
- Detalles de cada operación

---

## 🔑 Gestión de Claves

### Generar Claves del Síndico

```bash
npm run generate-keys
```

O vía API:
```bash
POST /api/keys/generate
{
  "keyId": "sindico-omar-main"
}
```

**Respuesta**:
```json
{
  "success": true,
  "keyId": "sindico-omar-main",
  "thumbprint": "a1b2c3d4e5f6g7h8",
  "createdAt": "2024-09-12T10:00:00Z",
  "expiresAt": "2025-09-12T10:00:00Z"
}
```

### Estructura de Almacenamiento

```
./keys/
├── sindico-omar-main.json    (Contiene ambas claves)
└── (otras claves si se generan)
```

---

## 📝 API Endpoints

### Gestión de Claves

#### `POST /api/keys/generate`
Generar par de claves RSA-2048

**Body**:
```json
{
  "keyId": "sindico-omar-main"
}
```

**Response**:
```json
{
  "success": true,
  "keyId": "sindico-omar-main",
  "thumbprint": "...",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601"
}
```

---

### Transacciones

#### `POST /api/transactions/create`
Crear transacción pendiente (>€100)

**Body**:
```json
{
  "amount": 5000,
  "currency": "EUR",
  "description": "Descripción de gasto",
  "signatory": "Omar",
  "notes": "Referencia adicional (opcional)"
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "TXN-DB-1234567890",
    "transactionId": "TXN-1234567890-a1b2c3d4",
    "amount": 5000,
    "status": "PENDING",
    "createdAt": "ISO-8601"
  }
}
```

---

#### `GET /api/transactions/pending`
Obtener transacciones pendientes de aprobación

**Response**:
```json
{
  "success": true,
  "count": 3,
  "transactions": [...]
}
```

---

#### `POST /api/transactions/:id/approve`
**OPERACIÓN CRÍTICA** - Síndico aprueba y firma

**Body**:
```json
{
  "keyId": "sindico-omar-main",
  "signatoryId": "Omar"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Transacción aprobada y firmada digitalmente",
  "signedTransaction": {
    "transactionId": "...",
    "amount": 5000,
    "algorithm": "RSA-SHA256",
    "verified": true
  },
  "proof": {
    "proofHash": "...(SHA-256)...",
    "timestamp": "ISO-8601",
    "isValid": true
  }
}
```

---

#### `POST /api/transactions/:id/execute`
Ejecutar transacción (verifica firma antes)

**Verificaciones Automáticas**:
- ✓ Estado = APPROVED
- ✓ Firma válida RSA-2048
- ✓ Integridad de datos
- ✓ Clave no expirada

**Response**:
```json
{
  "success": true,
  "message": "Transacción ejecutada exitosamente",
  "transaction": {
    "status": "EXECUTED",
    "signatureVerified": true,
    "executedAt": "ISO-8601"
  }
}
```

---

#### `POST /api/transactions/:id/verify`
Verificar firma de transacción

**Response**:
```json
{
  "success": true,
  "signatureValid": true,
  "algorithm": "RSA-SHA256",
  "signedBy": "Omar",
  "signedAt": "ISO-8601"
}
```

---

### Auditoría

#### `GET /api/audit/:id`
Obtener registro de auditoría completo

**Response**:
```json
{
  "success": true,
  "transactionId": "TXN-...",
  "auditLog": [
    {
      "action": "CREATED",
      "actor": "SYSTEM",
      "timestamp": "ISO-8601",
      "details": "Transacción creada por Omar"
    },
    {
      "action": "SIGNED",
      "actor": "Omar",
      "timestamp": "ISO-8601",
      "details": "Firmada con RSA-2048"
    },
    {
      "action": "EXECUTED",
      "actor": "SYSTEM",
      "timestamp": "ISO-8601",
      "details": "Ejecutada exitosamente"
    }
  ],
  "entriesCount": 3
}
```

---

## 🧪 Testing

### Demostración Completa

```bash
npm run demo
```

Ejecuta flujo completo:
1. Inicializa base de datos
2. Genera/carga claves RSA-2048
3. Crea transacción de €5,000
4. Síndico firma digitalmente
5. Verifica firma
6. Ejecuta transacción
7. Muestra auditoría

---

## 💾 Base de Datos

### Schema - Tabla `transactions`

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  transactionId TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  signatory TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  signature TEXT,           -- Firma RSA-2048 en hex
  keyId TEXT,              -- ID de clave usada
  algorithm TEXT,          -- RSA-SHA256
  createdAt TEXT NOT NULL,
  approvedAt TEXT,
  executedAt TEXT,
  notes TEXT
);
```

### Schema - Tabla `audit_log`

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transactionId TEXT NOT NULL,
  action TEXT NOT NULL,    -- CREATED, SIGNED, EXECUTED, REJECTED
  actor TEXT NOT NULL,     -- Omar, SYSTEM, etc
  timestamp TEXT NOT NULL,
  details TEXT,
  FOREIGN KEY(transactionId) REFERENCES transactions(transactionId)
);
```

---

## 🛡️ Seguridad

### Medidas Implementadas

1. **Criptografía de Nivel Militar**
   - RSA-2048 (equivalente a seguridad de 112 bits contra ataques clásicos)
   - SHA-256 para hashing (estándar NIST)

2. **No Repudio**
   - Solo el Síndico (con su clave privada) puede firmar
   - Imposible negar que aprobó una transacción
   - Verificable criptográficamente por cualquier parte

3. **Auditoría Inmutable**
   - Cada operación registrada en BD
   - Timestamps precisos
   - Identificación de actor

4. **Integridad de Datos**
   - Firma verificada antes de ejecutar
   - Hash SHA-256 de operación
   - Proof hash para validación

---

## 📋 Responsabilidad Legal

### Estatutos de la SAS (Recomendados)

**Artículo X - Aprobación de Transacciones**

> "Las transacciones que excedan el monto de Cien Euros (€100) deberán ser aprobadas y firmadas digitalmente por el Síndico mediante algoritmo RSA-2048 (2048 bits) con función hash SHA-256. La firma digital constituye prueba de consentimiento irrevocable del Síndico."

**Artículo Y - Responsabilidad Solidaria**

> "El Síndico y la Sociedad responden solidariamente ante terceros por el cumplimiento de las obligaciones contraídas mediante transacciones aprobadas por el Síndico. La firma digital RSA-2048 constituye evidencia de aprobación y aceptación del Síndico."

---

## 📊 Ejemplo de Flujo Completo

```
1. Sistema Bancario / Acreedor
   ↓
2. Crear Transacción (€5,000)
   Estado: PENDING
   ↓
3. Notificar al Síndico (Omar)
   Email: "Transacción requiere aprobación"
   ↓
4. Omar Aprueba y Firma
   - Autentica con contraseña/2FA
   - Revisa detalles
   - Genera firma RSA-2048
   - Proof: a1b2c3d4e5f6g7h8...
   ↓
5. Firma Verificada
   Status: APPROVED
   ✓ Transacción: $5,000
   ✓ Algoritmo: RSA-SHA256
   ✓ Signatory: Omar
   ↓
6. Sistema Ejecuta
   Status: EXECUTED
   ✓ Integridad confirmada
   ✓ Auditoría registrada
   ↓
7. Registro de Auditoría
   - CREATED (14:00:00)
   - SIGNED (14:05:30) por Omar
   - EXECUTED (14:06:00)
   ↓
8. Responsabilidad
   ✓ Síndico (Omar) certificó
   ✓ SAS aprobó
   ✓ Ambos responden solidariamente
```

---

## 🔧 Troubleshooting

### Error: "Clave RSA no encontrada"
```bash
# Generar nuevas claves
npm run generate-keys
```

### Error: "Clave expirada"
- Las claves vencen tras 365 días
- Generar nueva: `npm run generate-keys`
- Actualizar `keyId` en requests

### Error: "Firma no válida"
- Verifica que no cambió la transacción después de firmar
- Comprueba que se usa la clave pública correcta
- Asegúrate de usar el mismo keyId que al firmar

---

## 📞 Soporte

**Síndico (Omar)**: omsortiz.uk1@outlook.com

---

## 📄 Licencia

MIT License - Año 2024

---

**Sistema de Aprobación Digital | Gobernanza Corporativa SAS | RSA-2048 | Omar (Síndico)**
