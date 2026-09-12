#!/bin/bash

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║  🧪 PRODUCTION INTEGRATION TEST                            ║
║  All 3 Layers - Complete Corporate Governance System       ║
╚════════════════════════════════════════════════════════════╝
${NC}"

TESTS_PASSED=0
TESTS_FAILED=0

# ════════════════════════════════════════════════════════════
# LAYER 1: KYC/AML COMPLIANCE TESTS
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}LAYER 1: KYC/AML COMPLIANCE${NC}"
echo "─────────────────────────────────────────"

# Test 1.1: Register Client
echo -e "\n${BLUE}[Test 1.1] Client Registration${NC}"
TIMESTAMP=$(date +%s)
CEDULA="17234567${TIMESTAMP: -2}"
REGISTER=$(curl -s -X POST "$BASE_URL/compliance/kyc/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"cedula\": \"$CEDULA\",
    \"fullName\": \"Maria Rodríguez García\",
    \"email\": \"maria-$TIMESTAMP@example.com\",
    \"phone\": \"+593999999999\",
    \"address\": \"Quito, Ecuador\"
  }")

CLIENT_ID=$(echo "$REGISTER" | python3 -c "import sys, json; data = json.load(sys.stdin); client = data.get('client', {}); print(client.get('id', data.get('clientId', '')))" 2>/dev/null)

if [ ! -z "$CLIENT_ID" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Client ID: $CLIENT_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $REGISTER"
    ((TESTS_FAILED++))
fi

# Test 1.2: Verify KYC
echo -e "\n${BLUE}[Test 1.2] KYC Verification${NC}"
VERIFY=$(curl -s -X POST "$BASE_URL/compliance/kyc/verify/$CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{}')

KYC_STATUS=$(echo "$VERIFY" | python3 -c "import sys, json; data = json.load(sys.stdin); client = data.get('client', {}); print(client.get('kycStatus', data.get('kycStatus', '')))" 2>/dev/null)

if [ "$KYC_STATUS" == "VERIFIED" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - KYC Status: $KYC_STATUS"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 1.3: AML Transaction Validation
echo -e "\n${BLUE}[Test 1.3] AML Compliance Check${NC}"
AML_CHECK=$(curl -s -X POST "$BASE_URL/compliance/validate-transaction" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"amount\": 50000,
    \"description\": \"Test transaction\"
  }")

CAN_PROCEED=$(echo "$AML_CHECK" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('canProceed', False))" 2>/dev/null)

if [ "$CAN_PROCEED" == "True" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Transaction approved"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# ════════════════════════════════════════════════════════════
# LAYER 2: ACCOUNT SEGREGATION TESTS
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}LAYER 2: ACCOUNT SEGREGATION${NC}"
echo "─────────────────────────────────────────"

# Test 2.1: Create CLIENT Account
echo -e "\n${BLUE}[Test 2.1] Create CLIENT Account${NC}"
ACC_CLIENT=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountNumber\": \"ACC-PROD-CLIENT-001\",
    \"bankName\": \"Production Bank A\",
    \"accountType\": \"CLIENT\",
    \"clientId\": \"$CLIENT_ID\"
  }")

CLIENT_ACCT=$(echo "$ACC_CLIENT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('accountId', ''))" 2>/dev/null)

if [ ! -z "$CLIENT_ACCT" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Account: $CLIENT_ACCT"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2.2: Create COMPANY Account
echo -e "\n${BLUE}[Test 2.2] Create COMPANY Account${NC}"
ACC_COMPANY=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ACC-PROD-COMPANY-001",
    "bankName": "Production Bank B",
    "accountType": "COMPANY",
    "clientId": "company-xio"
  }')

COMPANY_ACCT=$(echo "$ACC_COMPANY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('accountId', ''))" 2>/dev/null)

if [ ! -z "$COMPANY_ACCT" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Account: $COMPANY_ACCT"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2.3: Create GUARANTEE Account
echo -e "\n${BLUE}[Test 2.3] Create GUARANTEE Account${NC}"
ACC_GUARANTEE=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ACC-PROD-GUARANTEE-001",
    "bankName": "Production Bank C",
    "accountType": "GUARANTEE",
    "clientId": "guarantee-fund"
  }')

GUARANTEE_ACCT=$(echo "$ACC_GUARANTEE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('accountId', ''))" 2>/dev/null)

if [ ! -z "$GUARANTEE_ACCT" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Account: $GUARANTEE_ACCT"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2.4: Create INSURANCE Account
echo -e "\n${BLUE}[Test 2.4] Create INSURANCE Account${NC}"
ACC_INSURANCE=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ACC-PROD-INSURANCE-001",
    "bankName": "Production Bank D",
    "accountType": "INSURANCE",
    "clientId": "insurance-cyber"
  }')

INSURANCE_ACCT=$(echo "$ACC_INSURANCE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('accountId', ''))" 2>/dev/null)

if [ ! -z "$INSURANCE_ACCT" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Account: $INSURANCE_ACCT"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2.5: Deposit Funds
echo -e "\n${BLUE}[Test 2.5] Deposit Funds to CLIENT Account${NC}"
DEPOSIT=$(curl -s -X POST "$BASE_URL/segregation/transactions/record" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"$CLIENT_ACCT\",
    \"transactionType\": \"DEPOSIT\",
    \"amount\": 150000,
    \"currency\": \"EUR\",
    \"description\": \"Production test deposit\"
  }")

DEPOSIT_ID=$(echo "$DEPOSIT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('ledgerId', ''))" 2>/dev/null)

if [ ! -z "$DEPOSIT_ID" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Deposit: €150,000"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2.6: Allocate Guarantee Fund
echo -e "\n${BLUE}[Test 2.6] Allocate Guarantee Fund (5% AUM)${NC}"
GUARANTEE=$(curl -s -X POST "$BASE_URL/segregation/guarantee/allocate" \
  -H "Content-Type: application/json" \
  -d "{
    \"fromAccountId\": \"$CLIENT_ACCT\",
    \"toAccountId\": \"$GUARANTEE_ACCT\",
    \"percentage\": 0.05
  }")

GUARANTEE_ALLOCATED=$(echo "$GUARANTEE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)

if [ "$GUARANTEE_ALLOCATED" == "True" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - €7,500 allocated (5%)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# ════════════════════════════════════════════════════════════
# LAYER 3: RSA-2048 DIGITAL SIGNATURES
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}LAYER 3: RSA-2048 DIGITAL SIGNATURES${NC}"
echo "─────────────────────────────────────────"

# Test 4.1: Generate RSA Keys
echo -e "\n${BLUE}[Test 4.1] Generate RSA-2048 Keys${NC}"
KEYGEN=$(curl -s -X POST "$BASE_URL/api/keys/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": "sindico-production-key"
  }')

KEY_ID=$(echo "$KEYGEN" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('keyId', ''))" 2>/dev/null)

if [ ! -z "$KEY_ID" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Key ID: $KEY_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 4.2: Create Transaction
echo -e "\n${BLUE}[Test 4.2] Create Transaction (Pending Approval)${NC}"
TXN=$(curl -s -X POST "$BASE_URL/api/transactions/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 50000,
    \"currency\": \"EUR\",
    \"description\": \"Production test transaction\",
    \"signatory\": \"Omar\"
  }")

TXN_ID=$(echo "$TXN" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('transactionId', ''))" 2>/dev/null)
TXN_STATUS=$(echo "$TXN" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', ''))" 2>/dev/null)

if [ ! -z "$TXN_ID" ] && [ "$TXN_STATUS" == "PENDING" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Transaction: $TXN_ID"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 4.3: Approve Transaction
echo -e "\n${BLUE}[Test 4.3] Síndico Approves Transaction${NC}"
APPROVE=$(curl -s -X POST "$BASE_URL/api/transactions/$TXN_ID/approve" \
  -H "Content-Type: application/json" \
  -d "{
    \"keyId\": \"$KEY_ID\",
    \"signatory\": \"Omar\"
  }")

APPROVED=$(echo "$APPROVE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', ''))" 2>/dev/null)

if [ "$APPROVED" == "APPROVED" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Transaction approved and signed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 4.4: Execute Transaction
echo -e "\n${BLUE}[Test 4.4] Execute Signed Transaction${NC}"
EXECUTE=$(curl -s -X POST "$BASE_URL/api/transactions/$TXN_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

EXECUTED=$(echo "$EXECUTE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', ''))" 2>/dev/null)

if [ "$EXECUTED" == "EXECUTED" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Transaction executed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# ════════════════════════════════════════════════════════════
# INTEGRITY & COMPLIANCE VERIFICATION
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}VERIFICATION & INTEGRITY${NC}"
echo "─────────────────────────────────────────"

# Test 5.1: Segregation Compliance Report
echo -e "\n${BLUE}[Test 5.1] Account Segregation Compliance Report${NC}"
REPORT=$(curl -s -X GET "$BASE_URL/segregation/compliance/report")

COMPLIANCE=$(echo "$REPORT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('compliance', ''))" 2>/dev/null)

if [ "$COMPLIANCE" == "COMPLIANT" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - System 100% compliant"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 5.2: Client Compliance Status
echo -e "\n${BLUE}[Test 5.2] Client Compliance Status${NC}"
CLIENT_STATUS=$(curl -s -X GET "$BASE_URL/compliance/client/$CLIENT_ID")

KYCED=$(echo "$CLIENT_STATUS" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('kycStatus', ''))" 2>/dev/null)

if [ "$KYCED" == "VERIFIED" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Client KYC verified"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 5.3: Integrity Verification
echo -e "\n${BLUE}[Test 5.3] Segregation Integrity Verification${NC}"
INTEGRITY=$(curl -s -X GET "$BASE_URL/segregation/integrity/verify")

INTEGRITY_OK=$(echo "$INTEGRITY" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('status', ''))" 2>/dev/null)

if [ "$INTEGRITY_OK" == "VERIFIED" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - All proofs verified"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# ════════════════════════════════════════════════════════════
# FINAL RESULTS
# ════════════════════════════════════════════════════════════

echo -e "\n${BLUE}
╔════════════════════════════════════════════════════════════╗
║  📊 PRODUCTION INTEGRATION TEST RESULTS                    ║
╚════════════════════════════════════════════════════════════╝
${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo -e "\n${GREEN}Tests Passed: $TESTS_PASSED/$TOTAL${NC}"
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}Tests Failed: $TESTS_FAILED/$TOTAL${NC}"
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL PRODUCTION INTEGRATION TESTS PASSED                  ║${NC}"
    echo -e "${GREEN}║  System ready for production use                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}Tests Failed: $TESTS_FAILED/$TOTAL${NC}"
    echo -e "\n${RED}❌ Some tests failed - Review logs and retry${NC}"
fi

echo -e "\n${YELLOW}Test Coverage Summary:${NC}"
echo "  ✓ LAYER 1: KYC/AML Compliance (3 tests)"
echo "  ✓ LAYER 2: Account Segregation (6 tests)"
echo "  ✓ LAYER 3: RSA-2048 Signatures (4 tests)"
echo "  ✓ Verification & Integrity (3 tests)"
echo "  ─────────────────────────────────"
echo "  ✓ TOTAL: 16 tests"
