import express, { Request, Response } from 'express';
import { AccountManager, AccountType, TransactionType } from '../compliance/account-segregation';

const router = express.Router();
const accountManager = new AccountManager();

// ✅ ENDPOINT 1: Crear cuenta segregada
router.post('/segregation/accounts/create', (req: Request, res: Response) => {
  try {
    const { accountNumber, bankName, accountType, currency, clientId } = req.body;

    if (!accountType || !['CLIENT', 'COMPANY', 'GUARANTEE', 'INSURANCE'].includes(accountType)) {
      return res.status(400).json({
        error: 'Invalid account type',
        validTypes: ['CLIENT', 'COMPANY', 'GUARANTEE', 'INSURANCE'],
      });
    }

    const account = accountManager.createAccount(
      accountNumber,
      bankName,
      accountType as AccountType,
      currency || 'EUR',
      clientId
    );

    res.json({
      success: true,
      message: `${accountType} account created successfully`,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountType: account.accountType,
        currency: account.currency,
        balance: account.balance,
        createdAt: account.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 2: Registrar transacción (depósito, retiro, transferencia)
router.post('/segregation/transactions/record', (req: Request, res: Response) => {
  try {
    const { accountId, transactionType, amount, description, relatedAccountId } = req.body;

    if (!accountId || !transactionType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: accountId, transactionType, amount',
      });
    }

    const entry = accountManager.recordTransaction(
      accountId,
      transactionType as TransactionType,
      amount,
      description,
      relatedAccountId
    );

    res.json({
      success: true,
      message: 'Transaction recorded',
      entry: {
        id: entry.id,
        transactionType: entry.transactionType,
        amount: entry.amount,
        balance: entry.balance,
        status: entry.status,
        proof: entry.proof.substring(0, 16) + '...',
        createdAt: entry.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 3: Verificar entrada de ledger
router.post('/segregation/ledger/verify/:accountId/:entryId', (req: Request, res: Response) => {
  try {
    const { accountId, entryId } = req.params;
    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      return res.status(400).json({ error: 'verifiedBy is required' });
    }

    const entry = accountManager.verifyEntry(entryId, accountId, verifiedBy);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({
      success: true,
      message: 'Entry verified',
      entry: {
        id: entry.id,
        status: entry.status,
        verifiedAt: entry.verifiedAt,
        verifiedBy: entry.verifiedBy,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 4: Conciliar cuenta
router.post('/segregation/accounts/:accountId/reconcile', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const result = accountManager.reconcileAccount(accountId);

    res.json({
      success: result.isReconciled,
      message: result.isReconciled ? 'Account reconciled successfully' : 'Reconciliation failed',
      reconciliation: {
        isReconciled: result.isReconciled,
        discrepancies: result.discrepancies,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 5: Transferir fondos entre cuentas
router.post('/segregation/transfers/create', (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, reason } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: fromAccountId, toAccountId, amount',
      });
    }

    const success = accountManager.transferFunds(fromAccountId, toAccountId, amount, reason);

    res.json({
      success,
      message: 'Transfer completed',
      transfer: {
        fromAccountId,
        toAccountId,
        amount,
        reason,
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 6: Asignar fondo de garantía (5% AUM)
router.post('/segregation/guarantee/allocate', (req: Request, res: Response) => {
  try {
    const { clientFundAccountId, guaranteeAccountId } = req.body;

    if (!clientFundAccountId || !guaranteeAccountId) {
      return res.status(400).json({
        error: 'Missing required fields: clientFundAccountId, guaranteeAccountId',
      });
    }

    const success = accountManager.allocateGuaranteeFund(clientFundAccountId, guaranteeAccountId);

    const clientAccount = accountManager.getAccount(clientFundAccountId);
    const guaranteeAmount = (clientAccount?.balance || 0) * 0.05;

    res.json({
      success,
      message: 'Guarantee fund allocated (5% of AUM)',
      allocation: {
        clientFundAccountId,
        guaranteeAccountId,
        aum: clientAccount?.balance,
        guaranteeAmount,
        ratio: 0.05,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ENDPOINT 7: Obtener reporte de segregación
router.get('/segregation/compliance/report', (req: Request, res: Response) => {
  try {
    const report = accountManager.getSegregationReport();

    res.json({
      success: true,
      report: {
        totalClientFunds: report.totalClientFunds,
        totalCompanyFunds: report.totalCompanyFunds,
        guaranteeFund: report.guaranteeFund,
        insuranceFund: report.insuranceFund,
        aum: report.aum,
        guaranteeRatio: report.guaranteeRatio,
        isCompliant: report.isCompliant,
        requiredGuarantee: report.aum * 0.05,
        compliance: {
          clientFundsOk: report.totalClientFunds >= 0,
          guaranteeOk: report.guaranteeFund >= report.aum * 0.05,
          companyFundsOk: report.totalCompanyFunds >= 0,
          insuranceOk: report.insuranceFund > 0,
        },
        discrepancies: report.discrepancies,
        lastAuditDate: report.lastAuditDate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 8: Obtener detalles de cuenta
router.get('/segregation/accounts/:accountId', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const account = accountManager.getAccount(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const auditTrail = accountManager.getAuditTrail(accountId);

    res.json({
      success: true,
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        accountType: account.accountType,
        currency: account.currency,
        balance: account.balance,
        isActive: account.isActive,
        createdAt: account.createdAt,
        lastUpdatedAt: account.lastUpdatedAt,
        transactionCount: auditTrail.length,
      },
      auditTrail: auditTrail.map((entry) => ({
        id: entry.id,
        transactionType: entry.transactionType,
        amount: entry.amount,
        balance: entry.balance,
        status: entry.status,
        description: entry.description,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 9: Obtener cuentas por tipo
router.get('/segregation/accounts/type/:accountType', (req: Request, res: Response) => {
  try {
    const { accountType } = req.params;

    if (!['CLIENT', 'COMPANY', 'GUARANTEE', 'INSURANCE'].includes(accountType)) {
      return res.status(400).json({
        error: 'Invalid account type',
        validTypes: ['CLIENT', 'COMPANY', 'GUARANTEE', 'INSURANCE'],
      });
    }

    const accounts = accountManager.getAccountsByType(accountType as AccountType);

    res.json({
      success: true,
      accountType,
      count: accounts.length,
      accounts: accounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        bankName: a.bankName,
        currency: a.currency,
        balance: a.balance,
        createdAt: a.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ENDPOINT 10: Verificar integridad de segregación
router.get('/segregation/integrity/verify', (req: Request, res: Response) => {
  try {
    const result = accountManager.verifySegregationIntegrity();

    res.json({
      success: result.isIntegrated,
      integrity: {
        isIntegrated: result.isIntegrated,
        status: result.isIntegrated ? '✅ All accounts properly segregated' : '❌ Segregation issues detected',
        issues: result.issues,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
