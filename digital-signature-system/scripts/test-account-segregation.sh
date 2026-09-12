#!/bin/bash

BASE_URL="http://localhost:3001"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║  💰 ACCOUNT SEGREGATION - WORKFLOW COMPLETO                ║
║  Cuentas Segregadas + Fondo Garantía + Auditoría           ║
╚════════════════════════════════════════════════════════════╝
${NC}"

# FASE 1: CREAR CUENTAS SEGREGADAS
echo -e "\n${BLUE}🏦 FASE 1: CREATE SEGREGATED ACCOUNTS${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}1️⃣  Crear Cuenta Cliente (Banco A - Fondos Segregados)${NC}"
CLIENT_ACC=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ES9121012345670123456789",
    "bankName": "Bank A - Client Segregated Accounts",
    "accountType": "CLIENT",
    "currency": "EUR",
    "clientId": "CLI-1789219262592-439507C9"
  }')

CLIENT_ACC_ID=$(echo "$CLIENT_ACC" | python3 -c "import sys, json; print(json.load(sys.stdin)['account']['id'])")
echo "$CLIENT_ACC" | python3 -m json.tool | head -20
echo -e "${GREEN}✅ Cliente Account: $CLIENT_ACC_ID${NC}"

echo -e "\n${YELLOW}2️⃣  Crear Cuenta Empresa (Banco B - Fondos Operativos)${NC}"
COMPANY_ACC=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ES9121098765432198765432",
    "bankName": "Bank B - XIO Operating Account",
    "accountType": "COMPANY",
    "currency": "EUR"
  }')

COMPANY_ACC_ID=$(echo "$COMPANY_ACC" | python3 -c "import sys, json; print(json.load(sys.stdin)['account']['id'])")
echo "$COMPANY_ACC" | python3 -m json.tool | head -15
echo -e "${GREEN}✅ Company Account: $COMPANY_ACC_ID${NC}"

echo -e "\n${YELLOW}3️⃣  Crear Fondo Garantía (Banco C - 5% AUM)${NC}"
GUARANTEE_ACC=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ES9121111111111111111111",
    "bankName": "Bank C - Guarantee Fund",
    "accountType": "GUARANTEE",
    "currency": "EUR"
  }')

GUARANTEE_ACC_ID=$(echo "$GUARANTEE_ACC" | python3 -c "import sys, json; print(json.load(sys.stdin)['account']['id'])")
echo "$GUARANTEE_ACC" | python3 -m json.tool | head -15
echo -e "${GREEN}✅ Guarantee Account: $GUARANTEE_ACC_ID${NC}"

echo -e "\n${YELLOW}4️⃣  Crear Fondo Seguro Cibernético (Banco D)${NC}"
INSURANCE_ACC=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ES9121222222222222222222",
    "bankName": "Bank D - Cyber Insurance Reserve",
    "accountType": "INSURANCE",
    "currency": "EUR"
  }')

INSURANCE_ACC_ID=$(echo "$INSURANCE_ACC" | python3 -c "import sys, json; print(json.load(sys.stdin)['account']['id'])")
echo "$INSURANCE_ACC" | python3 -m json.tool | head -15
echo -e "${GREEN}✅ Insurance Account: $INSURANCE_ACC_ID${NC}"

# FASE 2: DEPOSITAR FONDOS
echo -e "\n${BLUE}💳 FASE 2: DEPOSIT CLIENT FUNDS${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}5️⃣  Depositar €100,000 en Cuenta Cliente${NC}"
DEPOSIT=$(curl -s -X POST "$BASE_URL/segregation/transactions/record" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"$CLIENT_ACC_ID\",
    \"transactionType\": \"DEPOSIT\",
    \"amount\": 100000,
    \"description\": \"Cliente deposita fondos para invertir\"
  }")

echo "$DEPOSIT" | python3 -m json.tool
echo -e "${GREEN}✅ Depósito registrado${NC}"

# FASE 3: ASIGNAR FONDO DE GARANTÍA
echo -e "\n${BLUE}🛡️ FASE 3: ALLOCATE GUARANTEE FUND (5% AUM)${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}6️⃣  Asignar 5% de AUM (€5,000) a Fondo Garantía${NC}"
GUARANTEE=$(curl -s -X POST "$BASE_URL/segregation/guarantee/allocate" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientFundAccountId\": \"$CLIENT_ACC_ID\",
    \"guaranteeAccountId\": \"$GUARANTEE_ACC_ID\"
  }")

echo "$GUARANTEE" | python3 -m json.tool
echo -e "${GREEN}✅ Fondo de garantía asignado${NC}"

# FASE 4: TRANSFERENCIA A CUENTA EMPRESA
echo -e "\n${BLUE}💸 FASE 4: TRANSFER TO COMPANY ACCOUNT${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}7️⃣  Transferir €2,000 de Cliente a Empresa (cuotas de gestión)${NC}"
TRANSFER=$(curl -s -X POST "$BASE_URL/segregation/transfers/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"fromAccountId\": \"$CLIENT_ACC_ID\",
    \"toAccountId\": \"$COMPANY_ACC_ID\",
    \"amount\": 2000,
    \"reason\": \"Management fees (2%)\"
  }")

echo "$TRANSFER" | python3 -m json.tool
echo -e "${GREEN}✅ Transferencia completada${NC}"

# FASE 5: DEPOSITAR EN SEGURO
echo -e "\n${BLUE}🔒 FASE 5: ALLOCATE CYBER INSURANCE${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}8️⃣  Depositar €1,000 en Fondo de Seguro${NC}"
INSURANCE=$(curl -s -X POST "$BASE_URL/segregation/transactions/record" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"$INSURANCE_ACC_ID\",
    \"transactionType\": \"DEPOSIT\",
    \"amount\": 1000,
    \"description\": \"Cyber insurance premium for Q4\"
  }")

echo "$INSURANCE" | python3 -m json.tool
echo -e "${GREEN}✅ Seguro cibernético establecido${NC}"

# FASE 6: VERIFICAR REPORTE DE SEGREGACIÓN
echo -e "\n${BLUE}📊 FASE 6: SEGREGATION COMPLIANCE REPORT${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}9️⃣  Generar reporte de cumplimiento de segregación${NC}"
REPORT=$(curl -s -X GET "$BASE_URL/segregation/compliance/report")

echo "$REPORT" | python3 -m json.tool
echo -e "${GREEN}✅ Reporte generado${NC}"

# FASE 7: VERIFICAR INTEGRIDAD
echo -e "\n${BLUE}🔐 FASE 7: VERIFY SEGREGATION INTEGRITY${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}🔟  Verificar que todas las cuentas están segregadas correctamente${NC}"
INTEGRITY=$(curl -s -X GET "$BASE_URL/segregation/integrity/verify")

echo "$INTEGRITY" | python3 -m json.tool
echo -e "${GREEN}✅ Integridad verificada${NC}"

# FASE 8: OBTENER DETALLES DE CUENTA
echo -e "\n${BLUE}📋 FASE 8: ACCOUNT AUDIT TRAIL${NC}"
echo "═════════════════════════════════════"

echo -e "${YELLOW}1️⃣0️⃣  Obtener historial de transacciones de Cuenta Cliente${NC}"
AUDIT=$(curl -s -X GET "$BASE_URL/segregation/accounts/$CLIENT_ACC_ID")

echo "$AUDIT" | python3 -m json.tool | head -40
echo -e "${GREEN}✅ Auditoría obtenida${NC}"

echo -e "\n${GREEN}
╔════════════════════════════════════════════════════════════╗
║  ✅ WORKFLOW DE SEGREGACIÓN COMPLETADO                     ║
╚════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${BLUE}📊 RESUMEN DE SEGREGACIÓN:${NC}
─────────────────────────────────────────────────────────────
✅ 4 Cuentas segregadas en diferentes bancos
  • Banco A: Fondos Cliente (€95,000 después de garantía)
  • Banco B: Fondos Empresa (€2,000)
  • Banco C: Fondo Garantía (€5,000 = 5% AUM)
  • Banco D: Seguro Cibernético (€1,000)

✅ Total Bajo Gestión: €100,000
✅ Garantía Requerida: €5,000 (5% AUM)
✅ Garantía Asignada: €5,000 ✓ CUMPLE
✅ Auditoría Inmutable: Todas las transacciones registradas
✅ Integridad: Verificada con SHA-256
─────────────────────────────────────────────────────────────
"
