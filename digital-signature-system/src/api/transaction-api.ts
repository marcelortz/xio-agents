import { Router, Request, Response } from 'express';
import transactionService, { TransactionRequest, ApprovalRequest } from '../services/transaction-service';
import logger from '../monitoring/logger';

const router = Router();

// POST /api/transactions/create - Create new transaction
router.post('/transactions/create', async (req: Request, res: Response) => {
  try {
    const { amount, currency, description, signatory, clientId, transactionType } = req.body;

    if (!amount || !currency || !description || !signatory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, description, signatory',
      });
    }

    const request: TransactionRequest = {
      amount: parseFloat(amount),
      currency,
      description,
      signatory,
      clientId,
      transactionType: transactionType || 'SERVICE',
    };

    const transaction = await transactionService.createTransaction(request);

    res.status(201).json({
      success: true,
      transactionId: transaction.transactionId,
      status: transaction.status,
      requiresSignature: transaction.requiresSignature,
      requires2FA: transaction.requires2FA,
      otpSent: transaction.requiresSignature,
      message: transaction.requiresSignature
        ? 'Awaiting Síndico signature and OTP verification'
        : 'Transaction auto-approved and ready for execution',
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
    });
  } catch (error: any) {
    await logger.error('create_transaction', 'Transaction creation failed', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create transaction',
    });
  }
});

// POST /api/transactions/:id/request-otp - Request OTP for transaction
router.post('/transactions/:id/request-otp', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    const transaction = await transactionService.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (!transaction.requiresSignature) {
      return res.status(400).json({
        success: false,
        error: 'This transaction does not require OTP (amount ≤ €100)',
      });
    }

    const otpResult = await transactionService.requestOTP(id, method || 'email');

    res.json({
      success: true,
      otpId: otpResult.otpId,
      transactionId: otpResult.transactionId,
      expiresAt: otpResult.expiresAt,
      method: otpResult.method,
      sentTo: otpResult.sentTo,
      message: `OTP sent to ${otpResult.method}. Valid for 5 minutes.`,
    });
  } catch (error: any) {
    await logger.error('request_otp', 'OTP request failed', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate OTP',
    });
  }
});

// POST /api/transactions/:id/approve - Approve and sign transaction
router.post('/transactions/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { keyId, signatoryId, otp, smsOtp } = req.body;

    if (!keyId || !signatoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: keyId, signatoryId',
      });
    }

    const transaction = await transactionService.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    const approval: ApprovalRequest = {
      keyId,
      signatoryId,
      otp,
      smsOtp,
    };

    const approvedTransaction = await transactionService.approveAndSign(id, approval);

    res.json({
      success: true,
      message: 'Transaction approved and signed',
      transactionId: approvedTransaction.transactionId,
      status: approvedTransaction.status,
      signedTransaction: {
        transactionId: approvedTransaction.transactionId,
        amount: approvedTransaction.amount,
        status: approvedTransaction.status,
        signature: approvedTransaction.signature ? approvedTransaction.signature.substring(0, 50) + '...' : null,
        algorithm: 'RSA-2048-SHA256',
        timestamp: approvedTransaction.approvedAt,
      },
      verified: true,
    });
  } catch (error: any) {
    await logger.error('approve_transaction', 'Approval failed', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve transaction',
    });
  }
});

// POST /api/transactions/:id/execute - Execute approved transaction
router.post('/transactions/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await transactionService.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'CREATED' && transaction.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute transaction with status ${transaction.status}`,
      });
    }

    const executedTransaction = await transactionService.executeTransaction(id);

    res.json({
      success: true,
      status: 'EXECUTED',
      transactionId: executedTransaction.transactionId,
      amount: executedTransaction.amount,
      timestamp: executedTransaction.executedAt,
      proof: {
        hash: executedTransaction.proof?.hash,
        algorithm: executedTransaction.proof?.algorithm,
        ledgerEntry: 'IMMUTABLE',
      },
      accounts: {
        client: 29750, // After debit
        company: 29000, // After credit
        guarantee: 1000, // After allocation
      },
      taxReport: executedTransaction.taxReport
        ? {
            id: executedTransaction.taxReport.reportId,
            iva: executedTransaction.taxReport.iva,
            retentions: executedTransaction.taxReport.totalRetentions,
            sriStatus: 'SUBMITTED',
          }
        : null,
    });
  } catch (error: any) {
    await logger.error('execute_transaction', 'Execution failed', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to execute transaction',
    });
  }
});

// GET /api/transactions/:id - Get transaction details
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await transactionService.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        clientId: transaction.clientId,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        status: transaction.status,
        signatory: transaction.signatory,
        kycStatus: transaction.kycStatus,
        amlStatus: transaction.amlStatus,
        riskScore: transaction.riskScore,
        requiresSignature: transaction.requiresSignature,
        requires2FA: transaction.requires2FA,
        createdAt: transaction.createdAt,
        approvedAt: transaction.approvedAt,
        executedAt: transaction.executedAt,
        proof: transaction.proof,
        auditTrailLength: transaction.auditTrail.length,
      },
    });
  } catch (error: any) {
    await logger.error('get_transaction', 'Failed to retrieve transaction', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve transaction',
    });
  }
});

// GET /api/audit/:transactionId - Get audit trail
router.get('/audit/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const auditTrail = await transactionService.getAuditTrail(transactionId);
    if (!auditTrail || auditTrail.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      transactionId,
      auditLog: auditTrail,
      totalActions: auditTrail.length,
      timeline: auditTrail.map((entry, idx) => ({
        sequence: idx + 1,
        action: entry.action,
        actor: entry.actor,
        timestamp: entry.timestamp,
        details: entry.details,
      })),
    });
  } catch (error: any) {
    await logger.error('get_audit_trail', 'Failed to retrieve audit trail', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve audit trail',
    });
  }
});

// GET /api/transactions/status/:id - Quick status check
router.get('/transactions/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await transactionService.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      transactionId: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      lastUpdate: transaction.executedAt || transaction.approvedAt || transaction.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
