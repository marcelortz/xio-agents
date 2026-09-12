import express, { Request, Response } from 'express';
import RSAKeyManager from '../crypto/rsa-keys';
import DigitalSignatureManager from '../crypto/digital-signature';
import TransactionsRepository from '../db/transactions-repository';

const router = express.Router();

// Instancias compartidas
const keyManager = new RSAKeyManager('./keys');
const signatureManager = new DigitalSignatureManager();
const transactionsRepo = new TransactionsRepository('./transactions.db');

// Middleware de inicialización
router.use(async (req: Request, res: Response, next) => {
  try {
    await transactionsRepo.initialize();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error inicializando base de datos' });
  }
});

// Génesis: Generar claves RSA-2048 para el Síndico
router.post('/api/keys/generate', (req: Request, res: Response) => {
  try {
    const keyId = req.body.keyId || 'sindico-omar-main';
    const keyPair = keyManager.generateKeyPair(keyId);

    const thumbprint = keyManager.getPublicKeyThumbprint(keyPair.publicKey);

    res.json({
      success: true,
      keyId: keyPair.keyId,
      thumbprint,
      createdAt: keyPair.createdAt,
      expiresAt: keyPair.expiresAt,
      message: `Claves RSA-2048 generadas exitosamente para ${keyId}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear transacción pendiente de aprobación
router.post('/api/transactions/create', async (req: Request, res: Response) => {
  try {
    const { amount, currency, description, signatory, notes } = req.body;

    // Validar que sea mayor a €100
    if (amount <= 100) {
      return res.status(400).json({
        error: 'Transacciones <= €100 no requieren firma digital',
        minimumAmount: 100,
      });
    }

    const transactionId = signatureManager.generateTransactionId();
    const transaction = await transactionsRepo.createTransaction(
      transactionId,
      amount,
      currency,
      description,
      signatory,
      notes
    );

    // Registrar creación en auditoría
    await transactionsRepo.logAuditEntry(
      transactionId,
      'CREATED',
      signatory,
      `Transacción de ${amount} ${currency} creada - ${description}`
    );

    res.json({
      success: true,
      transaction,
      message: 'Transacción creada. Requiere aprobación y firma del Síndico (Omar)',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener transacciones pendientes (para el Síndico)
router.get('/api/transactions/pending', async (req: Request, res: Response) => {
  try {
    const pendingTransactions = await transactionsRepo.getPendingTransactions();

    res.json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions,
      message: `${pendingTransactions.length} transacción(es) pendiente(s) de aprobación`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener transacciones por monto (> €100)
router.get('/api/transactions/high-value', async (req: Request, res: Response) => {
  try {
    const minAmount = parseFloat(req.query.minAmount as string) || 100;
    const transactions = await transactionsRepo.getTransactionsByAmount(minAmount);

    res.json({
      success: true,
      minAmount,
      count: transactions.length,
      transactions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener transacción específica
router.get('/api/transactions/:transactionId', async (req: Request, res: Response) => {
  try {
    const transaction = await transactionsRepo.getTransaction(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    const auditLog = await transactionsRepo.getAuditLog(req.params.transactionId);

    res.json({
      success: true,
      transaction,
      auditLog,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Aprobar y firmar transacción (OPERACIÓN CRÍTICA DEL SÍNDICO)
router.post('/api/transactions/:transactionId/approve', async (req: Request, res: Response) => {
  try {
    const { keyId = 'sindico-omar-main', signatoryId = 'Omar' } = req.body;

    // Obtener transacción
    const transaction = await transactionsRepo.getTransaction(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        error: `Transacción ya fue ${transaction.status}`,
        currentStatus: transaction.status,
      });
    }

    // Cargar clave privada del Síndico
    const keyPair = keyManager.loadKeyPair(keyId);

    if (keyManager.isKeyExpired(keyPair)) {
      return res.status(400).json({ error: 'Clave expirada - se requiere renovación' });
    }

    // Crear firma digital RSA-2048
    const signatureData = signatureManager.sign(
      {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        signatory: signatoryId,
      },
      keyPair.privateKey,
      keyId
    );

    // Guardar firma en base de datos
    await transactionsRepo.approveAndSign(req.params.transactionId, signatureData);

    // Generar prueba criptográfica
    const proof = signatureManager.createSignatureProof(signatureData, keyPair.publicKey);

    // Registrar en auditoría
    await transactionsRepo.logAuditEntry(
      req.params.transactionId,
      'SIGNED',
      signatoryId,
      `Transacción firmada digitalmente con RSA-2048 - Proof: ${proof.proofHash}`
    );

    res.json({
      success: true,
      message: 'Transacción aprobada y firmada digitalmente',
      signedTransaction: {
        transactionId: signatureData.transactionId,
        amount: signatureData.amount,
        signatory: signatureData.signatory,
        timestamp: signatureData.timestamp,
        algorithm: signatureData.algorithm,
        verified: proof.isValid,
      },
      proof: {
        proofHash: proof.proofHash,
        timestamp: proof.timestamp,
        isValid: proof.isValid,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rechazar transacción
router.post('/api/transactions/:transactionId/reject', async (req: Request, res: Response) => {
  try {
    const { reason = 'No especificado' } = req.body;

    const transaction = await transactionsRepo.getTransaction(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Solo se pueden rechazar transacciones pendientes' });
    }

    await transactionsRepo.rejectTransaction(req.params.transactionId, reason);

    await transactionsRepo.logAuditEntry(
      req.params.transactionId,
      'REJECTED',
      'SYSTEM',
      `Razón: ${reason}`
    );

    res.json({
      success: true,
      message: 'Transacción rechazada',
      transactionId: req.params.transactionId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar transacción aprobada
router.post('/api/transactions/:transactionId/execute', async (req: Request, res: Response) => {
  try {
    const transaction = await transactionsRepo.getTransaction(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (transaction.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Solo se pueden ejecutar transacciones aprobadas',
        currentStatus: transaction.status,
      });
    }

    // Verificar firma antes de ejecutar
    if (!transaction.signature) {
      return res.status(400).json({ error: 'Transacción no tiene firma válida' });
    }

    const keyPair = keyManager.loadKeyPair(transaction.keyId || 'sindico-omar-main');
    const signatureData = {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      signatory: transaction.signatory,
      signature: transaction.signature,
      keyId: transaction.keyId || 'default',
      algorithm: transaction.algorithm || 'RSA-SHA256',
      timestamp: transaction.approvedAt || new Date(),
      verified: false,
    };

    const isValid = signatureManager.verify(signatureData, keyPair.publicKey);

    if (!isValid) {
      return res.status(400).json({ error: 'Firma no válida - no se puede ejecutar' });
    }

    // Ejecutar transacción
    await transactionsRepo.executeTransaction(req.params.transactionId);

    await transactionsRepo.logAuditEntry(
      req.params.transactionId,
      'EXECUTION_CONFIRMED',
      'SYSTEM',
      'Transacción ejecutada con firma verificada'
    );

    res.json({
      success: true,
      message: 'Transacción ejecutada exitosamente',
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: 'EXECUTED',
        executedAt: new Date(),
        signatureVerified: isValid,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar firma de una transacción
router.post('/api/transactions/:transactionId/verify', async (req: Request, res: Response) => {
  try {
    const transaction = await transactionsRepo.getTransaction(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    if (!transaction.signature) {
      return res.status(400).json({ error: 'Transacción no tiene firma' });
    }

    const keyPair = keyManager.loadKeyPair(transaction.keyId || 'sindico-omar-main');

    const signatureData = {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      signatory: transaction.signatory,
      signature: transaction.signature,
      keyId: transaction.keyId || 'default',
      algorithm: transaction.algorithm || 'RSA-SHA256',
      timestamp: transaction.approvedAt || new Date(),
      verified: false,
    };

    const isValid = signatureManager.verify(signatureData, keyPair.publicKey);

    res.json({
      success: true,
      transactionId: req.params.transactionId,
      signatureValid: isValid,
      algorithm: transaction.algorithm,
      signedBy: transaction.signatory,
      signedAt: transaction.approvedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener registro de auditoría
router.get('/api/audit/:transactionId', async (req: Request, res: Response) => {
  try {
    const auditLog = await transactionsRepo.getAuditLog(req.params.transactionId);

    res.json({
      success: true,
      transactionId: req.params.transactionId,
      auditLog,
      entriesCount: auditLog.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Digital Signature Approval System',
    version: '1.0.0',
    features: [
      'RSA-2048 key generation',
      'Digital transaction signing',
      'Transaction approval workflow',
      'Audit trail logging',
      'Cryptographic verification',
    ],
  });
});

export default router;
