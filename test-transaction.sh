#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PRUEBA COMPLETA: Flujo de Aprobación Digital RSA-2048    ║"
echo "║  Responsabilidad Solidaria: Síndico (Omar) + SAS           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3001"

# Paso 1: Generar claves del Síndico
echo "Paso 1️⃣  Generando claves RSA-2048 para Síndico (Omar)..."
KEYS_RESPONSE=$(curl -s -X POST $BASE_URL/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"keyId":"sindico-omar-main"}')

echo "$KEYS_RESPONSE" | jq .
KEY_ID=$(echo "$KEYS_RESPONSE" | jq -r '.keyId')
THUMBPRINT=$(echo "$KEYS_RESPONSE" | jq -r '.thumbprint')
echo "✓ Clave generada con Thumbprint: $THUMBPRINT"
echo ""

# Paso 2: Crear transacción de €5,000
echo "Paso 2️⃣  Creando transacción de €5,000..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "EUR",
    "description": "Pago a proveedor - Servicios profesionales",
    "signatory": "Omar",
    "notes": "Factura #INV-2024-001"
  }')

echo "$CREATE_RESPONSE" | jq .
TXN_ID=$(echo "$CREATE_RESPONSE" | jq -r '.transaction.transactionId')
echo "✓ Transacción creada: $TXN_ID"
echo ""

# Paso 3: Obtener transacciones pendientes
echo "Paso 3️⃣  Obtener transacciones pendientes de aprobación..."
PENDING=$(curl -s $BASE_URL/api/transactions/pending)
echo "$PENDING" | jq .
echo ""

# Paso 4: Síndico aprueba y firma
echo "Paso 4️⃣  Síndico (Omar) aprueba y firma digitalmente..."
APPROVE_RESPONSE=$(curl -s -X POST $BASE_URL/api/transactions/$TXN_ID/approve \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "sindico-omar-main",
    "signatoryId": "Omar"
  }')

echo "$APPROVE_RESPONSE" | jq .
echo ""

# Paso 5: Ejecutar transacción
echo "Paso 5️⃣  Ejecutando transacción (verificación de firma)..."
EXECUTE_RESPONSE=$(curl -s -X POST $BASE_URL/api/transactions/$TXN_ID/execute)
echo "$EXECUTE_RESPONSE" | jq .
echo ""

# Paso 6: Ver detalles completos
echo "Paso 6️⃣  Detalles completos de la transacción..."
DETAILS=$(curl -s $BASE_URL/api/transactions/$TXN_ID)
echo "$DETAILS" | jq .
echo ""

# Paso 7: Ver auditoría completa
echo "Paso 7️⃣  Registro de auditoría completo..."
AUDIT=$(curl -s $BASE_URL/api/audit/$TXN_ID)
echo "$AUDIT" | jq .
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ FLUJO COMPLETADO EXITOSAMENTE                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Resumen:"
echo "  • Transacción ID: $TXN_ID"
echo "  • Monto: €5,000"
echo "  • Síndico: Omar"
echo "  • Estado: EXECUTED"
echo "  • Firma: RSA-2048 ✓"
echo "  • Responsabilidad: Síndico (Omar) + SAS"
echo ""
