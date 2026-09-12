#!/bin/bash

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TIMESTAMP=$(date +%s)

echo -e "${BLUE}
╔════════════════════════════════════════════════════════════╗
║  🧪 PRODUCTION INTEGRATION TEST v2                         ║
║  All 3 Layers - Complete Corporate Governance System       ║
╚════════════════════════════════════════════════════════════╝
${NC}"

# ════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════

extract_json() {
    local json=$1
    local path=$2
    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    keys = '$path'.split('.')
    for key in keys:
        if isinstance(data, dict):
            data = data.get(key, '')
        else:
            data = ''
    print(data if data else '')
except:
    print('')
" 2>/dev/null <<< "$json"
}

test_passed() {
    local name=$1
    local detail=$2
    echo -e "${GREEN}✅ PASSED${NC} - $detail"
    ((TESTS_PASSED++))
}

test_failed() {
    local name=$1
    local detail=$2
    echo -e "${RED}❌ FAILED${NC} - $detail"
    ((TESTS_FAILED++))
}

# ════════════════════════════════════════════════════════════
# LAYER 1: KYC/AML COMPLIANCE TESTS
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}LAYER 1: KYC/AML COMPLIANCE${NC}"
echo "─────────────────────────────────────────"

# Test 1.1: Register Client
echo -e "\n${BLUE}[Test 1.1] Client Registration${NC}"
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

CLIENT_ID=$(extract_json "$REGISTER" "client.id")
if [ ! -z "$CLIENT_ID" ] && [ "$CLIENT_ID" != "None" ]; then
    test_passed "1.1" "Client ID: $CLIENT_ID"
else
    test_failed "1.1" "Could not register client"
fi

# Test 1.2: Verify KYC
echo -e "\n${BLUE}[Test 1.2] KYC Verification${NC}"
VERIFY=$(curl -s -X POST "$BASE_URL/compliance/kyc/verify/$CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{}')

KYC_STATUS=$(extract_json "$VERIFY" "client.kycStatus")
if [ "$KYC_STATUS" == "VERIFIED" ]; then
    test_passed "1.2" "KYC Status: VERIFIED"
else
    test_failed "1.2" "KYC not verified (got: $KYC_STATUS)"
fi

# Test 1.3: AML Compliance Check
echo -e "\n${BLUE}[Test 1.3] AML Compliance Check${NC}"
AML_CHECK=$(curl -s -X POST "$BASE_URL/compliance/validate-transaction" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"amount\": 50000,
    \"description\": \"Test transaction\"
  }")

CAN_PROCEED=$(extract_json "$AML_CHECK" "canProceed")
if [ "$CAN_PROCEED" == "True" ]; then
    test_passed "1.3" "Transaction approved (AML clean)"
else
    test_failed "1.3" "AML check failed"
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
    \"accountNumber\": \"ACC-PROD-CLIENT-$TIMESTAMP\",
    \"bankName\": \"Production Bank A\",
    \"accountType\": \"CLIENT\",
    \"clientId\": \"$CLIENT_ID\"
  }")

CLIENT_ACCT=$(extract_json "$ACC_CLIENT" "account.id")
if [ ! -z "$CLIENT_ACCT" ] && [ "$CLIENT_ACCT" != "None" ]; then
    test_passed "2.1" "Account: $CLIENT_ACCT"
else
    test_failed "2.1" "Account creation failed"
fi

# Test 2.2: Create COMPANY Account
echo -e "\n${BLUE}[Test 2.2] Create COMPANY Account${NC}"
ACC_COMPANY=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountNumber\": \"ACC-PROD-COMPANY-$TIMESTAMP\",
    \"bankName\": \"Production Bank B\",
    \"accountType\": \"COMPANY\",
    \"clientId\": \"company-xio\"
  }")

COMPANY_ACCT=$(extract_json "$ACC_COMPANY" "account.id")
if [ ! -z "$COMPANY_ACCT" ] && [ "$COMPANY_ACCT" != "None" ]; then
    test_passed "2.2" "Account: $COMPANY_ACCT"
else
    test_failed "2.2" "Company account creation failed"
fi

# Test 2.3: Create GUARANTEE Account
echo -e "\n${BLUE}[Test 2.3] Create GUARANTEE Account${NC}"
ACC_GUARANTEE=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountNumber\": \"ACC-PROD-GUARANTEE-$TIMESTAMP\",
    \"bankName\": \"Production Bank C\",
    \"accountType\": \"GUARANTEE\",
    \"clientId\": \"guarantee-fund\"
  }")

GUARANTEE_ACCT=$(extract_json "$ACC_GUARANTEE" "account.id")
if [ ! -z "$GUARANTEE_ACCT" ] && [ "$GUARANTEE_ACCT" != "None" ]; then
    test_passed "2.3" "Account: $GUARANTEE_ACCT"
else
    test_failed "2.3" "Guarantee account creation failed"
fi

# Test 2.4: Create INSURANCE Account
echo -e "\n${BLUE}[Test 2.4] Create INSURANCE Account${NC}"
ACC_INSURANCE=$(curl -s -X POST "$BASE_URL/segregation/accounts/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountNumber\": \"ACC-PROD-INSURANCE-$TIMESTAMP\",
    \"bankName\": \"Production Bank D\",
    \"accountType\": \"INSURANCE\",
    \"clientId\": \"insurance-cyber\"
  }")

INSURANCE_ACCT=$(extract_json "$ACC_INSURANCE" "account.id")
if [ ! -z "$INSURANCE_ACCT" ] && [ "$INSURANCE_ACCT" != "None" ]; then
    test_passed "2.4" "Account: $INSURANCE_ACCT"
else
    test_failed "2.4" "Insurance account creation failed"
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

DEPOSIT_ID=$(extract_json "$DEPOSIT" "ledgerId")
if [ ! -z "$DEPOSIT_ID" ] && [ "$DEPOSIT_ID" != "None" ]; then
    test_passed "2.5" "Deposit: €150,000"
else
    test_failed "2.5" "Deposit failed"
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

GUARANTEE_SUCCESS=$(extract_json "$GUARANTEE" "success")
if [ "$GUARANTEE_SUCCESS" == "True" ]; then
    test_passed "2.6" "€7,500 allocated (5%)"
else
    test_failed "2.6" "Guarantee allocation failed"
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
  -d "{
    \"keyId\": \"sindico-prod-$TIMESTAMP\"
  }")

KEY_ID=$(extract_json "$KEYGEN" "keyId")
if [ ! -z "$KEY_ID" ] && [ "$KEY_ID" != "None" ]; then
    test_passed "4.1" "Key ID: $KEY_ID"
else
    test_failed "4.1" "Key generation failed"
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

TXN_ID=$(extract_json "$TXN" "transactionId")
TXN_STATUS=$(extract_json "$TXN" "status")
if [ ! -z "$TXN_ID" ] && [ "$TXN_ID" != "None" ] && [ "$TXN_STATUS" == "PENDING" ]; then
    test_passed "4.2" "Transaction: $TXN_ID"
else
    test_failed "4.2" "Transaction creation failed (status: $TXN_STATUS)"
fi

# Test 4.3: Approve Transaction
echo -e "\n${BLUE}[Test 4.3] Síndico Approves Transaction${NC}"
APPROVE=$(curl -s -X POST "$BASE_URL/api/transactions/$TXN_ID/approve" \
  -H "Content-Type: application/json" \
  -d "{
    \"keyId\": \"$KEY_ID\",
    \"signatory\": \"Omar\"
  }")

APPROVED=$(extract_json "$APPROVE" "status")
if [ "$APPROVED" == "APPROVED" ]; then
    test_passed "4.3" "Transaction approved and signed"
else
    test_failed "4.3" "Approval failed (status: $APPROVED)"
fi

# Test 4.4: Execute Transaction
echo -e "\n${BLUE}[Test 4.4] Execute Signed Transaction${NC}"
EXECUTE=$(curl -s -X POST "$BASE_URL/api/transactions/$TXN_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

EXECUTED=$(extract_json "$EXECUTE" "status")
if [ "$EXECUTED" == "EXECUTED" ]; then
    test_passed "4.4" "Transaction executed"
else
    test_failed "4.4" "Execution failed (status: $EXECUTED)"
fi

# ════════════════════════════════════════════════════════════
# INTEGRITY & COMPLIANCE VERIFICATION
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}VERIFICATION & INTEGRITY${NC}"
echo "─────────────────────────────────────────"

# Test 5.1: Segregation Compliance Report
echo -e "\n${BLUE}[Test 5.1] Account Segregation Compliance Report${NC}"
REPORT=$(curl -s -X GET "$BASE_URL/segregation/compliance/report")
COMPLIANCE=$(extract_json "$REPORT" "compliance")
if [ "$COMPLIANCE" == "COMPLIANT" ]; then
    test_passed "5.1" "System 100% compliant"
else
    test_failed "5.1" "Compliance check failed"
fi

# Test 5.2: Client Compliance Status
echo -e "\n${BLUE}[Test 5.2] Client Compliance Status${NC}"
CLIENT_STATUS=$(curl -s -X GET "$BASE_URL/compliance/client/$CLIENT_ID")
KYCED=$(extract_json "$CLIENT_STATUS" "kycStatus")
if [ "$KYCED" == "VERIFIED" ]; then
    test_passed "5.2" "Client KYC verified"
else
    test_failed "5.2" "Client compliance failed"
fi

# Test 5.3: Integrity Verification
echo -e "\n${BLUE}[Test 5.3] Segregation Integrity Verification${NC}"
INTEGRITY=$(curl -s -X GET "$BASE_URL/segregation/integrity/verify")
INTEGRITY_OK=$(extract_json "$INTEGRITY" "status")
if [ "$INTEGRITY_OK" == "VERIFIED" ]; then
    test_passed "5.3" "All proofs verified"
else
    test_failed "5.3" "Integrity check failed"
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
    echo -e "${GREEN}Tests Failed: 0/$TOTAL${NC}"
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL PRODUCTION INTEGRATION TESTS PASSED                  ║${NC}"
    echo -e "${GREEN}║  System ready for production use                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}Tests Failed: $TESTS_FAILED/$TOTAL${NC}"
fi

echo -e "\n${YELLOW}Test Coverage:${NC}"
echo "  ✓ LAYER 1: KYC/AML Compliance (3 tests)"
echo "  ✓ LAYER 2: Account Segregation (6 tests)"
echo "  ✓ LAYER 3: RSA-2048 Signatures (4 tests)"
echo "  ✓ Verification & Integrity (3 tests)"
echo "  ─────────────────────────────────"
echo "  ✓ TOTAL: 16 tests executed"

exit $TESTS_FAILED
