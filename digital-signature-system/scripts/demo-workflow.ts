import RSAKeyManager from '../src/crypto/rsa-keys';
import DigitalSignatureManager from '../src/crypto/digital-signature';
import TransactionsRepository from '../src/db/transactions-repository';

async function demonstrateWorkflow() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     DEMOSTRACIÓN: Flujo de Aprobación Digital RSA-2048     ║
║     Responsabilidad Solidaria: Síndico (Omar) + SAS        ║
╚════════════════════════════════════════════════════════════╝
  `);

  const keyManager = new RSAKeyManager('./keys');
  const signatureManager = new DigitalSignatureManager();
  const transactionsRepo = new TransactionsRepository('./transactions.db');

  try {
    // Paso 1: Inicializar base de datos
    console.log('Paso 1️⃣  Inicializando base de datos...');
    await transactionsRepo.initialize();
    console.log('✓ Base de datos inicializada\n');

    // Paso 2: Generar claves RSA-2048 para el Síndico
    console.log('Paso 2️⃣  Generando claves RSA-2048 para Síndico (Omar)...');
    let keyPair;
    const existingKeys = keyManager.listKeys();

    if (existingKeys.includes('sindico-omar-main')) {
      console.log('✓ Usando claves existentes...');
      keyPair = keyManager.loadKeyPair('sindico-omar-main');
    } else {
      keyPair = keyManager.generateKeyPair('sindico-omar-main');
      console.log(`✓ Claves generadas:
   - Key ID: ${keyPair.keyId}
   - Tamaño: 2048 bits
   - Algoritmo: RSA-SHA256
   - Vencimiento: ${keyPair.expiresAt.toLocaleDateString('es-ES')}\n`);
    }

    const thumbprint = keyManager.getPublicKeyThumbprint(keyPair.publicKey);
    console.log(`✓ Thumbprint de clave pública: ${thumbprint}\n`);

    // Paso 3: Crear transacción de alto valor
    console.log('Paso 3️⃣  Creando transacción de €5,000 (> €100)...');
    const transaction = await transactionsRepo.createTransaction(
      signatureManager.generateTransactionId(),
      5000,
      'EUR',
      'Pago a proveedor - Servicios profesionales',
      'Omar',
      'Factura #INV-2024-001'
    );

    console.log(`✓ Transacción creada:
   - ID: ${transaction.transactionId}
   - Monto: ${transaction.amount} ${transaction.currency}
   - Estado: ${transaction.status}
   - Fecha: ${transaction.createdAt.toLocaleString('es-ES')}\n`);

    // Paso 4: Registrar en auditoría
    await transactionsRepo.logAuditEntry(
      transaction.transactionId,
      'WORKFLOW_STARTED',
      'SYSTEM',
      'Iniciando flujo de aprobación y firma digital'
    );

    // Paso 5: Síndico aprueba y firma digitalmente
    console.log('Paso 5️⃣  Síndico (Omar) aprueba y firma digitalmente...');

    const signatureData = signatureManager.sign(
      {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        signatory: 'Omar',
      },
      keyPair.privateKey,
      'sindico-omar-main'
    );

    console.log(`✓ Transacción firmada:
   - Algoritmo: ${signatureData.algorithm}
   - Timestamp: ${signatureData.timestamp.toLocaleString('es-ES')}
   - Firma (primeros 32 chars): ${signatureData.signature.substring(0, 32)}...\n`);

    // Guardar en BD
    await transactionsRepo.approveAndSign(transaction.transactionId, signatureData);

    // Paso 6: Verificar firma
    console.log('Paso 6️⃣  Verificando firma digital...');
    const isValid = signatureManager.verify(signatureData, keyPair.publicKey);

    const proof = signatureManager.createSignatureProof(signatureData, keyPair.publicKey);

    console.log(`✓ Firma verificada: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}
   - Proof Hash: ${proof.proofHash}
   - Verificado en: ${proof.timestamp.toLocaleString('es-ES')}\n`);

    // Paso 7: Ejecutar transacción
    console.log('Paso 7️⃣  Ejecutando transacción...');
    await transactionsRepo.executeTransaction(transaction.transactionId);
    console.log('✓ Transacción ejecutada exitosamente\n');

    // Paso 8: Mostrar registro de auditoría
    console.log('Paso 8️⃣  Registro de auditoría completo:');
    const auditLog = await transactionsRepo.getAuditLog(transaction.transactionId);

    console.log('┌─ Historial de transacción ─────────────────────────┐');
    auditLog.forEach((entry, index) => {
      console.log(`│ ${index + 1}. [${entry.action}]`);
      console.log(`│    Actor: ${entry.actor}`);
      console.log(`│    Timestamp: ${new Date(entry.timestamp).toLocaleString('es-ES')}`);
      console.log(`│    Detalles: ${entry.details}`);
      console.log('│');
    });
    console.log('└────────────────────────────────────────────────────┘\n');

    // Paso 9: Mostrar resumen legal
    console.log('Paso 9️⃣  Resumen de responsabilidad legal:');
    console.log(`┌─ Marco Legal ──────────────────────────────────────┐
│ Estructura: SAS (Sociedad por Acciones Simplificada)
│ Síndico: Omar
│ Responsabilidad: SOLIDARIA (Síndico + SAS)
│
│ Transacción:
│ • Monto: €${transaction.amount}
│ • Umbral de aprobación: €100
│ • Firma requerida: Sí (RSA-2048)
│ • Verificación: ✅ Exitosa
│
│ Seguridad:
│ • Algoritmo: RSA-SHA256
│ • Tamaño de clave: 2048 bits
│ • No repudio: Verificable criptográficamente
│ • Auditoría: Registro inmutable en BD
│
│ Estado Final: EXECUTED
│ Responsabilidad: Omar + SAS responden solidariamente
└────────────────────────────────────────────────────────────┘`);

    console.log(`\n✅ FLUJO COMPLETADO EXITOSAMENTE\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await transactionsRepo.close();
  }
}

// Ejecutar demostración
demonstrateWorkflow().catch(console.error);
