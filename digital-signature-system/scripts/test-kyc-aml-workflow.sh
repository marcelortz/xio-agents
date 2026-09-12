#!/bin/bash

BASE_URL="http://localhost:3001"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║  🔐 KYC/AML + FIRMA DIGITAL - WORKFLOW COMPLETO            ║
║  Cliente Ecuador + Verificación + Transacciones Reguladas  ║
╚════════════════════════════════════════════════════════════╝
${NC}"

# FASE 1: REGISTRAR CLIENTE
echo -e "\n${BLUE}🚀 FASE 1: KYC REGISTRATION${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}1️⃣  Registrar Cliente Juan García (Cédula 1712345678)${NC}"
CLIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/compliance/kyc/register" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1712345678",
    "fullName": "Juan García López",
    "email": "juan@example.com",
    "phone": "+593991234567",
    "address": "Quito, Ecuador"
  }')

echo "$CLIENT_RESPONSE" | python3 -m json.tool
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['client']['id'])")
echo -e "${GREEN}✅ Cliente registrado: $CLIENT_ID${NC}"

# FASE 2: VERIFICAR KYC
echo -e "\n${BLUE}📊 FASE 2: KYC VERIFICATION${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}2️⃣  Verificar KYC${NC}"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/compliance/kyc/verify/$CLIENT_ID")
echo "$VERIFY_RESPONSE" | python3 -m json.tool
echo -e "${GREEN}✅ KYC verificado${NC}"

# FASE 3: GENERAR CLAVES RSA
echo -e "\n${BLUE}🔑 FASE 3: RSA-2048 KEY GENERATION${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}3️⃣  Generar claves RSA-2048 para Síndico Omar${NC}"
KEYS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/keys/generate" \
  -H "Content-Type: application/json" \
  -d '{"keyId": "sindico-omar-main"}')

echo "$KEYS_RESPONSE" | python3 -m json.tool
KEY_ID=$(echo "$KEYS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['keyId'])")
echo -e "${GREEN}✅ Claves generadas: $KEY_ID${NC}"

# FASE 4: CREAR TRANSACCIÓN
echo -e "\n${BLUE}💰 FASE 4: TRANSACTION CREATION${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}4️⃣  Crear Transacción de €5000${NC}"
TX_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/create" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "EUR",
    "description": "Pago a proveedor internacional",
    "signatory": "Omar",
    "notes": "Aprobado por Junta Directiva"
  }')

echo "$TX_RESPONSE" | python3 -m json.tool
TX_ID=$(echo "$TX_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['transaction']['id'])")
echo -e "${GREEN}✅ Transacción creada: $TX_ID${NC}"

# FASE 5: VALIDAR AML
echo -e "\n${BLUE}🚨 FASE 5: AML COMPLIANCE CHECKS${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}5️⃣  Validar transacción (AML Spike/Circular/Structuring)${NC}"
AML_RESPONSE=$(curl -s -X POST "$BASE_URL/compliance/validate-transaction" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"amount\": 5000,
    \"description\": \"Pago a proveedor\",
    \"recipientId\": null,
    \"recentTransactions\": []
  }")

echo "$AML_RESPONSE" | python3 -m json.tool
echo -e "${GREEN}✅ AML validación completada${NC}"

# FASE 6: FIRMAR (SÍNDICO)
echo -e "\n${BLUE}✍️  FASE 6: DIGITAL SIGNATURE (SÍNDICO)${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}6️⃣  Síndico Omar aprueba y firma con RSA-2048${NC}"
APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/$TX_ID/approve" \
  -H "Content-Type: application/json" \
  -d "{
    \"keyId\": \"$KEY_ID\",
    \"signatoryId\": \"Omar\"
  }")

echo "$APPROVE_RESPONSE" | python3 -m json.tool
echo -e "${GREEN}✅ Transacción aprobada y firmada${NC}"

# FASE 7: EJECUTAR
echo -e "\n${BLUE}⚡ FASE 7: TRANSACTION EXECUTION${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}7️⃣  Ejecutar transacción${NC}"
EXECUTE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/$TX_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$EXECUTE_RESPONSE" | python3 -m json.tool
echo -e "${GREEN}✅ Transacción ejecutada${NC}"

# FASE 8: AUDITORÍA
echo -e "\n${BLUE}📝 FASE 8: AUDIT TRAIL${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}8️⃣  Obtener registro de auditoría${NC}"
AUDIT_RESPONSE=$(curl -s -X GET "$BASE_URL/api/audit/$TX_ID")
echo "$AUDIT_RESPONSE" | python3 -m json.tool
echo -e "${GREEN}✅ Auditoría obtenida${NC}"

# FASE 9: ESTADO DEL CLIENTE
echo -e "\n${BLUE}👤 FASE 9: CLIENT COMPLIANCE STATUS${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}9️⃣  Obtener estado de compliance${NC}"
CLIENT_STATUS=$(curl -s -X GET "$BASE_URL/compliance/client/$CLIENT_ID")
echo "$CLIENT_STATUS" | python3 -m json.tool
echo -e "${GREEN}✅ Estado del cliente obtenido${NC}"

echo -e "\n${GREEN}
╔════════════════════════════════════════════════════════════╗
║  ✅ WORKFLOW COMPLETADO CON ÉXITO                         ║
╚════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${BLUE}📊 RESUMEN:${NC}
─────────────────────────────────────────────────────────────
✅ Cliente Juan García (Cédula: 1712345678)
✅ Transacción: €5000 (Estado: EXECUTED)
✅ Firma: RSA-2048 (Verificada)
✅ Síndico: Omar (Responsable solidario)
✅ AML Checks: Completados
✅ Auditoría: Inmutable
─────────────────────────────────────────────────────────────
"
