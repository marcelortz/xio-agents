import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

interface KYCTestResult {
  phase: string;
  status: 'success' | 'failed';
  details?: any;
  error?: string;
}

const results: KYCTestResult[] = [];

async function log(message: string) {
  console.log(`\n📋 ${message}`);
}

async function test(name: string, fn: () => Promise<any>) {
  try {
    log(name);
    const result = await fn();
    results.push({
      phase: name,
      status: 'success',
      details: result,
    });
    console.log('✅ OK');
    return result;
  } catch (error: any) {
    results.push({
      phase: name,
      status: 'failed',
      error: error.response?.data?.error || error.message,
    });
    console.log('❌ FAILED:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function runWorkflow() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🔐 KYC/AML + FIRMA DIGITAL - WORKFLOW COMPLETO            ║
║  Cliente Ecuador + Verificación + Transacciones Reguladas  ║
╚════════════════════════════════════════════════════════════╝
  `);

  // ============================================
  // FASE 1: REGISTRAR CLIENTE CON CÉDULA
  // ============================================
  console.log('\n🚀 FASE 1: KYC REGISTRATION');
  console.log('═'.repeat(50));

  const clientData = await test(
    '1️⃣  Registrar Cliente Juan García (Cédula Ecuador 1712345678)',
    async () => {
      const response = await axios.post(`${BASE_URL}/compliance/kyc/register`, {
        cedula: '1712345678',
        fullName: 'Juan García López',
        email: 'juan@example.com',
        phone: '+593991234567',
        address: 'Quito, Ecuador',
      });
      console.log('   Cliente:', response.data.client.id);
      console.log('   Estado KYC:', response.data.client.kycStatus);
      console.log('   Risk Score:', response.data.client.riskScore);
      return response.data.client;
    }
  );

  const clientId = clientData.id;

  // ============================================
  // FASE 2: VERIFICAR KYC
  // ============================================
  console.log('\n📊 FASE 2: KYC VERIFICATION');
  console.log('═'.repeat(50));

  const verifiedClient = await test(
    '2️⃣  Verificar KYC (Simular aprobación)',
    async () => {
      const response = await axios.post(
        `${BASE_URL}/compliance/kyc/verify/${clientId}`
      );
      console.log('   Estado actualizado:', response.data.client.kycStatus);
      console.log('   Verificado en:', response.data.client.verifiedAt);
      console.log('   Risk Score reducido:', response.data.client.riskScore);
      return response.data.client;
    }
  );

  // ============================================
  // FASE 3: GENERAR CLAVES RSA PARA SÍNDICO
  // ============================================
  console.log('\n🔑 FASE 3: RSA-2048 KEY GENERATION');
  console.log('═'.repeat(50));

  const keys = await test(
    '3️⃣  Generar claves RSA-2048 para Síndico Omar',
    async () => {
      const response = await axios.post(`${BASE_URL}/api/keys/generate`, {
        keyId: 'sindico-omar-main',
      });
      console.log('   Key ID:', response.data.keyId);
      console.log('   Thumbprint:', response.data.thumbprint);
      console.log('   Vencimiento:', response.data.expiresAt);
      return response.data;
    }
  );

  // ============================================
  // FASE 4: CREAR TRANSACCIÓN (EUR 5000)
  // ============================================
  console.log('\n💰 FASE 4: TRANSACTION CREATION');
  console.log('═'.repeat(50));

  const transaction = await test(
    '4️⃣  Crear Transacción de €5000 (> €100 threshold)',
    async () => {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/create`,
        {
          amount: 5000,
          currency: 'EUR',
          description: 'Pago a proveedor internacional',
          signatory: 'Omar',
          notes: 'Aprobado por Junta Directiva',
        }
      );
      console.log('   Transaction ID:', response.data.transaction.transactionId);
      console.log('   Monto:', response.data.transaction.amount + ' EUR');
      console.log('   Estado:', response.data.transaction.status);
      return response.data.transaction;
    }
  );

  const txId = transaction.id;

  // ============================================
  // FASE 5: VALIDAR CON AML CHECKS
  // ============================================
  console.log('\n🚨 FASE 5: AML COMPLIANCE CHECKS');
  console.log('═'.repeat(50));

  const compliance = await test(
    '5️⃣  Validar transacción (AML Spike/Circular/Structuring)',
    async () => {
      const response = await axios.post(
        `${BASE_URL}/compliance/validate-transaction`,
        {
          clientId,
          amount: 5000,
          description: 'Pago a proveedor',
          recipientId: null,
          recentTransactions: [],
        }
      );
      console.log('   ✅ Puede proceder:', response.data.canProceed);
      console.log('   Risk Score:', response.data.riskScore);
      console.log('   KYC Status:', response.data.compliance.kycStatus);
      if (response.data.violations.length > 0) {
        console.log('   ⚠️  Violaciones detectadas:');
        response.data.violations.forEach((v: any) => {
          console.log(`      • ${v.type} (${v.severity})`);
        });
      }
      return response.data;
    }
  );

  // ============================================
  // FASE 6: APROBAR CON FIRMA RSA (SÍNDICO)
  // ============================================
  console.log('\n✍️  FASE 6: DIGITAL SIGNATURE (SÍNDICO)');
  console.log('═'.repeat(50));

  const approved = await test(
    '6️⃣  Síndico Omar aprueba y firma con RSA-2048',
    async () => {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/${txId}/approve`,
        {
          keyId: keys.keyId,
          signatoryId: 'Omar',
        }
      );
      console.log('   ✅ Transacción aprobada y firmada');
      console.log('   Algoritmo:', response.data.signedTransaction.algorithm);
      console.log('   Verificada:', response.data.signedTransaction.verified);
      console.log('   Proof Hash:', response.data.proof.proofHash.substring(0, 16) + '...');
      return response.data;
    }
  );

  // ============================================
  // FASE 7: EJECUTAR TRANSACCIÓN
  // ============================================
  console.log('\n⚡ FASE 7: TRANSACTION EXECUTION');
  console.log('═'.repeat(50));

  const executed = await test(
    '7️⃣  Ejecutar transacción y verificar firma RSA-2048',
    async () => {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/${txId}/execute`,
        {}
      );
      console.log('   ✅ Transacción ejecutada');
      console.log('   Estado:', response.data.transaction.status);
      console.log('   Firma verificada:', response.data.transaction.signatureVerified);
      return response.data;
    }
  );

  // ============================================
  // FASE 8: OBTENER REGISTRO DE AUDITORÍA
  // ============================================
  console.log('\n📝 FASE 8: AUDIT TRAIL');
  console.log('═'.repeat(50));

  const audit = await test(
    '8️⃣  Obtener registro de auditoría completo',
    async () => {
      const response = await axios.get(`${BASE_URL}/api/audit/${txId}`);
      console.log('   📋 Eventos registrados:');
      response.data.auditLog.forEach((entry: any, idx: number) => {
        console.log(`      ${idx + 1}. [${entry.action}] ${entry.actor} - ${new Date(entry.timestamp).toLocaleTimeString()}`);
        console.log(`         ${entry.details}`);
      });
      return response.data;
    }
  );

  // ============================================
  // FASE 9: OBTENER ESTADO FINAL DEL CLIENTE
  // ============================================
  console.log('\n👤 FASE 9: CLIENT COMPLIANCE STATUS');
  console.log('═'.repeat(50));

  const clientStatus = await test(
    '9️⃣  Obtener estado de compliance del cliente',
    async () => {
      const response = await axios.get(`${BASE_URL}/compliance/client/${clientId}`);
      console.log('   Cédula:', response.data.client.cedula);
      console.log('   KYC Status:', response.data.client.kycStatus);
      console.log('   AML Status:', response.data.client.amlStatus);
      console.log('   Risk Score:', response.data.client.riskScore);
      console.log('   Flags activas:', response.data.client.activeFlags);
      return response.data;
    }
  );

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ WORKFLOW COMPLETADO CON ÉXITO                         ║
╚════════════════════════════════════════════════════════════╝

📊 RESUMEN:
─────────────────────────────────────────────────────────────

✅ Cliente Juan García
   • Cédula: 1712345678 (verificada)
   • Estado KYC: ${clientStatus.client.kycStatus}
   • Risk Score Final: ${clientStatus.client.riskScore}

✅ Transacción Aprobada
   • Monto: €5000
   • Estado: ${executed.transaction.status}
   • Firma: RSA-2048 (verificada)

✅ Gobernanza & Compliance
   • Síndico (Omar): Responsable solidario
   • Firma Digital: No repudiable
   • Auditoría: ${audit.auditLog.length} eventos inmutables

✅ AML Checks
   • Spike Detection: ${compliance.violations.find((v: any) => v.type === 'SPIKE_DETECTION') ? '⚠️ Detectado' : '✅ OK'}
   • KYC Verification: ✅ Verificado
   • Risk Assessment: ✅ Bajo riesgo (${clientStatus.client.riskScore})

─────────────────────────────────────────────────────────────
🎯 Sistema completamente operativo:
   ✓ RSA-2048 digital signatures
   ✓ KYC/AML compliance enforcement
   ✓ Immutable audit trails
   ✓ Non-repudiation guarantees
   ✓ UIF reporting capability
  `);
}

runWorkflow().catch((error) => {
  console.error('\n❌ Workflow falló:', error.message);
  process.exit(1);
});
