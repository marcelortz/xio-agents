import express, { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import RSAKeyManager from '../crypto/rsa-keys';
import { TaxReportingEngine } from '../compliance/tax-reporting';

const router = Router();

// Crear instancia de base de datos para impuestos
const db = new sqlite3.Database('./tax-reports.db');
const keyManager = new RSAKeyManager('./keys');
let taxEngine: TaxReportingEngine;

// Middleware de inicialización
router.use((req: Request, res: Response, next) => {
  try {
    if (!taxEngine) {
      taxEngine = new TaxReportingEngine(db);
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error inicializando motor de impuestos' });
  }
});

export const initTaxAPI = () => {
  return router;
};

// POST /tax/calculate - Calcular impuestos para una transacción
router.post('/calculate', (req: Request, res: Response) => {
  try {
    const { amount, transactionType = 'SERVICE', currency = 'EUR' } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
      return;
    }

    const type = transactionType as 'SERVICE' | 'GOODS' | 'DIVIDEND';
    const taxes = taxEngine.calculateTaxes(amount, type, currency);

    const retentionMap: Record<string, number> = {
      SERVICE: 10,
      GOODS: 3,
      DIVIDEND: 15,
    };
    res.json({
      success: true,
      calculation: {
        ...taxes,
        ivaPercentage: 17,
        retentionPercentage: retentionMap[type] || 0,
        breakdown: {
          gross: taxes.grossAmount,
          ivaAdded: `+${taxes.ivaAmount} (17%)`,
          retentionDeducted: `-${taxes.retentionAmount}`,
          netResult: taxes.netAmount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /tax/generate-report - Generar reporte de impuestos con firma digital
router.post('/generate-report', (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      amount,
      transactionType = 'SERVICE',
      currency = 'EUR',
      keyId,
      signedBy,
    } = req.body;

    if (!transactionId || !amount || !keyId || !signedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    // Obtener clave privada
    let keyPair;
    try {
      keyPair = keyManager.loadKeyPair(keyId);
    } catch (e) {
      res.status(404).json({
        success: false,
        error: 'Key not found',
      });
      return;
    }

    // Generar reporte de impuestos
    const type = transactionType as 'SERVICE' | 'GOODS' | 'DIVIDEND';
    const taxReport = taxEngine.generateTaxReport(
      transactionId,
      amount,
      type,
      currency,
      keyPair.privateKey,
      signedBy
    );

    res.json({
      success: true,
      taxReport: {
        id: taxReport.id,
        transactionId: taxReport.transactionId,
        grossAmount: taxReport.grossAmount,
        ivaAmount: taxReport.ivaAmount,
        ivaPercentage: 17,
        retentionAmount: taxReport.retentionAmount,
        retentionType: taxReport.retentionType,
        netAmount: taxReport.netAmount,
        currency: taxReport.currency,
        signed: true,
        signature: taxReport.signature.substring(0, 20) + '...',
        signedBy: taxReport.signedBy,
        signedAt: taxReport.signedAt,
        proof: taxReport.proof.substring(0, 20) + '...',
        readyForSRIReporting: true,
      },
      message: 'Tax report generated with digital signature - Ready for SRI submission',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /tax/report-to-sri - Reportar a SRI automáticamente
router.post('/report-to-sri', async (req: Request, res: Response) => {
  try {
    const { taxReportId, taxpayerId } = req.body;

    if (!taxReportId || !taxpayerId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const result = await taxEngine.reportToSRI(taxReportId, taxpayerId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Report submitted to SRI (Ecuador Tax Authority)',
        sriReportId: result.sriReportId,
        responseCode: result.sriResponseCode,
        status: 'REPORTED_TO_SRI',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /tax/verify-signature - Verificar firma digital del reporte
router.post('/verify-signature', async (req: Request, res: Response) => {
  try {
    const { taxReportId, keyId } = req.body;

    if (!taxReportId || !keyId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    // Obtener clave pública
    let keyPair;
    try {
      keyPair = keyManager.loadKeyPair(keyId);
    } catch (e) {
      res.status(404).json({
        success: false,
        error: 'Key not found',
      });
      return;
    }

    // Verificar firma
    const isValid = await taxEngine.verifyTaxReport(taxReportId, keyPair.publicKey);
    res.json({
      success: true,
      verified: isValid,
      status: isValid
        ? 'Signature is valid - No tampering detected'
        : 'Signature verification failed',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /tax/report/:taxReportId - Obtener detalles del reporte de impuestos
router.get('/report/:taxReportId', async (req: Request, res: Response) => {
  try {
    const { taxReportId } = req.params;

    const report = await taxEngine.getTaxReport(taxReportId);

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Tax report not found',
      });
      return;
    }

    res.json({
      success: true,
      taxReport: {
        id: report.id,
        transactionId: report.transactionId,
        grossAmount: report.grossAmount,
        ivaAmount: report.ivaAmount,
        ivaPercentage: 17,
        retentionAmount: report.retentionAmount,
        retentionType: report.retentionType,
        netAmount: report.netAmount,
        currency: report.currency,
        reportedToSRI: report.reportedToSRI,
        sriReportId: report.sriReportId,
        sriReportedAt: report.sriReportedAt,
        signedBy: report.signedBy,
        signedAt: report.signedAt,
        proofHash: report.proof,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /tax/transaction/:transactionId - Obtener reportes de impuestos por transacción
router.get('/transaction/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    const reports = await taxEngine.getTaxReportsByTransaction(transactionId);

    res.json({
      success: true,
      transactionId,
      taxReports: reports.map((r) => ({
        id: r.id,
        grossAmount: r.grossAmount,
        ivaAmount: r.ivaAmount,
        netAmount: r.netAmount,
        reportedToSRI: r.reportedToSRI,
        signedAt: r.signedAt,
      })),
      count: reports.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /tax/pending-sri-reports - Obtener reportes pendientes de enviar a SRI
router.get('/pending-sri-reports', async (req: Request, res: Response) => {
  try {
    const reports = await taxEngine.getUnreportedTaxReports();

    res.json({
      success: true,
      pendingReports: reports.map((r) => ({
        id: r.id,
        transactionId: r.transactionId,
        grossAmount: r.grossAmount,
        ivaAmount: r.ivaAmount,
        retentionAmount: r.retentionAmount,
        netAmount: r.netAmount,
        signedAt: r.signedAt,
      })),
      count: reports.length,
      message:
        reports.length > 0
          ? `${reports.length} reports ready to be submitted to SRI`
          : 'All reports have been submitted to SRI',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /tax/sri-status/:taxReportId - Obtener estado del reporte en SRI
router.get('/sri-status/:taxReportId', async (req: Request, res: Response) => {
  try {
    const { taxReportId } = req.params;

    const status = await taxEngine.getSRIReportStatus(taxReportId);

    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Tax report not found',
      });
      return;
    }

    res.json({
      success: true,
      sriStatus: {
        status: status.status,
        sriReceiptNumber: status.sriReceiptNumber,
        sriResponseCode: status.sriResponseCode,
        sriProcessedAt: status.sriProcessedAt,
        transactionId: status.transactionId,
        amounts: status.amounts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /tax/compliance-report - Reporte de cumplimiento fiscal
router.get('/compliance-report', async (req: Request, res: Response) => {
  try {
    const report = await taxEngine.generateComplianceReport();

    res.json({
      success: true,
      complianceReport: {
        summary: {
          totalReports: report.totalReports,
          reportedToSRI: report.reportedToSRI,
          pendingSRI: report.pendingSRI,
          reportingPercentage: report.totalReports > 0
            ? Math.round((report.reportedToSRI / report.totalReports) * 100)
            : 0,
        },
        financials: {
          totalGrossAmount: `€${(report.totalIVA / 0.17).toFixed(2)}`,
          totalIVA: `€${report.totalIVA.toFixed(2)} (17%)`,
          totalRetentions: `€${report.totalRetentions.toFixed(2)}`,
          totalNetAmount: `€${report.totalNetAmount.toFixed(2)}`,
        },
        compliance: {
          status: report.pendingSRI === 0 ? '✅ COMPLIANT' : '⚠️  PARTIAL',
          message:
            report.pendingSRI === 0
              ? 'All tax reports have been reported to SRI'
              : `${report.pendingSRI} reports pending SRI submission`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
