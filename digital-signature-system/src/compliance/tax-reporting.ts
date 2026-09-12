import crypto from 'crypto';
import { Database } from 'sqlite3';

interface TaxReport {
  id: string;
  transactionId: string;
  grossAmount: number;
  ivaAmount: number;
  ivaRate: number;
  retentionAmount: number;
  retentionType: string;
  netAmount: number;
  currency: string;
  reportedToSRI: boolean;
  sriReportId?: string;
  sriReportedAt?: string;
  signature: string;
  signedBy: string;
  signedAt: string;
  proof: string;
}

interface SRIReportPayload {
  reportId: string;
  transactionId: string;
  grossAmount: number;
  ivaAmount: number;
  retentionAmount: number;
  netAmount: number;
  currency: string;
  taxpayerId: string;
  signature: string;
  timestamp: string;
}

export class TaxReportingEngine {
  private db: Database;
  private IVA_RATE = 0.17; // 17% IVA en Ecuador
  private RETENTION_RATES = {
    SERVICE: 0.10, // 10% para servicios
    GOODS: 0.03, // 3% para bienes
    DIVIDEND: 0.15, // 15% para dividendos
  };

  constructor(database: Database) {
    this.db = database;
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tax_reports (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL UNIQUE,
        grossAmount REAL NOT NULL,
        ivaAmount REAL NOT NULL,
        ivaRate REAL NOT NULL,
        retentionAmount REAL NOT NULL,
        retentionType TEXT NOT NULL,
        netAmount REAL NOT NULL,
        currency TEXT NOT NULL,
        reportedToSRI BOOLEAN DEFAULT 0,
        sriReportId TEXT,
        sriReportedAt TEXT,
        signature TEXT NOT NULL,
        signedBy TEXT NOT NULL,
        signedAt TEXT NOT NULL,
        proof TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS sri_reports (
        id TEXT PRIMARY KEY,
        taxReportId TEXT NOT NULL UNIQUE,
        sriResponseCode TEXT,
        sriResponseMessage TEXT,
        sriReceiptNumber TEXT,
        sriProcessedAt TEXT,
        retryCount INTEGER DEFAULT 0,
        lastRetryAt TEXT,
        status TEXT DEFAULT 'PENDING',
        FOREIGN KEY (taxReportId) REFERENCES tax_reports(id)
      )
    `);
  }

  calculateTaxes(
    grossAmount: number,
    transactionType: 'SERVICE' | 'GOODS' | 'DIVIDEND' = 'SERVICE',
    currency: string = 'EUR'
  ): {
    grossAmount: number;
    ivaAmount: number;
    retentionAmount: number;
    netAmount: number;
  } {
    // Calcular IVA (17% sobre el monto bruto)
    const ivaAmount = grossAmount * this.IVA_RATE;

    // Calcular retención según tipo de transacción
    const retentionRate = this.RETENTION_RATES[transactionType] || 0;
    const retentionAmount = (grossAmount + ivaAmount) * retentionRate;

    // Monto neto = Monto bruto + IVA - Retención
    const netAmount = grossAmount + ivaAmount - retentionAmount;

    return {
      grossAmount: Math.round(grossAmount * 100) / 100,
      ivaAmount: Math.round(ivaAmount * 100) / 100,
      retentionAmount: Math.round(retentionAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  generateTaxReport(
    transactionId: string,
    grossAmount: number,
    transactionType: 'SERVICE' | 'GOODS' | 'DIVIDEND',
    currency: string,
    privateKeyPem: string,
    signedBy: string
  ): TaxReport {
    const reportId = `TAX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const taxes = this.calculateTaxes(grossAmount, transactionType, currency);

    // Generar payload para firma
    const payload = JSON.stringify({
      reportId,
      transactionId,
      grossAmount: taxes.grossAmount,
      ivaAmount: taxes.ivaAmount,
      retentionAmount: taxes.retentionAmount,
      netAmount: taxes.netAmount,
      currency,
      timestamp: new Date().toISOString(),
    });

    // Firmar el reporte con clave privada RSA
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(payload);
    const signature = sign.sign(privateKeyPem, 'hex');

    // Generar proof SHA-256
    const proof = crypto.createHash('sha256').update(payload + signature).digest('hex');

    const now = new Date().toISOString();

    const taxReport: TaxReport = {
      id: reportId,
      transactionId,
      grossAmount: taxes.grossAmount,
      ivaAmount: taxes.ivaAmount,
      ivaRate: this.IVA_RATE,
      retentionAmount: taxes.retentionAmount,
      retentionType: transactionType,
      netAmount: taxes.netAmount,
      currency,
      reportedToSRI: false,
      signature,
      signedBy,
      signedAt: now,
      proof,
    };

    // Guardar en base de datos
    this.db.run(
      `INSERT INTO tax_reports (
        id, transactionId, grossAmount, ivaAmount, ivaRate,
        retentionAmount, retentionType, netAmount, currency,
        reportedToSRI, signature, signedBy, signedAt, proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        transactionId,
        taxes.grossAmount,
        taxes.ivaAmount,
        this.IVA_RATE,
        taxes.retentionAmount,
        transactionType,
        taxes.netAmount,
        currency,
        0,
        signature,
        signedBy,
        now,
        proof,
      ]
    );

    return taxReport;
  }

  async reportToSRI(
    taxReportId: string,
    taxpayerId: string
  ): Promise<{
    success: boolean;
    sriReportId?: string;
    sriResponseCode?: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      // Obtener reporte de impuestos
      this.db.get(
        'SELECT * FROM tax_reports WHERE id = ?',
        [taxReportId],
        async (err: any, taxReport: any) => {
          if (err || !taxReport) {
            resolve({
              success: false,
              error: 'Tax report not found',
            });
            return;
          }

          // Ya reportado a SRI
          if (taxReport.reportedToSRI) {
            resolve({
              success: true,
              sriReportId: taxReport.sriReportId,
              sriResponseCode: '200',
            });
            return;
          }

          try {
            // Generar payload para SRI
            const sriReportId = `SRI-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

            const sriPayload: SRIReportPayload = {
              reportId: sriReportId,
              transactionId: taxReport.transactionId,
              grossAmount: taxReport.grossAmount,
              ivaAmount: taxReport.ivaAmount,
              retentionAmount: taxReport.retentionAmount,
              netAmount: taxReport.netAmount,
              currency: taxReport.currency,
              taxpayerId,
              signature: taxReport.signature,
              timestamp: taxReport.signedAt,
            };

            // DEMO MODE: Simular reporte a SRI
            // En producción, esto sería un HTTP POST a api.sri.ec
            const sriResponse = {
              success: true,
              receiptNumber: `RCP-${Date.now()}`,
              processedAt: new Date().toISOString(),
              status: 'ACCEPTED',
            };

            // Actualizar reporte con información de SRI
            this.db.run(
              `UPDATE tax_reports SET reportedToSRI = 1, sriReportId = ?, sriReportedAt = ? WHERE id = ?`,
              [sriReportId, new Date().toISOString(), taxReportId]
            );

            // Guardar respuesta de SRI
            this.db.run(
              `INSERT INTO sri_reports (id, taxReportId, sriResponseCode, sriResponseMessage, sriReceiptNumber, sriProcessedAt, status)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                sriReportId,
                taxReportId,
                '200',
                'Report accepted by SRI',
                sriResponse.receiptNumber,
                sriResponse.processedAt,
                'ACCEPTED',
              ]
            );

            resolve({
              success: true,
              sriReportId: sriReportId,
              sriResponseCode: '200',
            });
          } catch (error: any) {
            resolve({
              success: false,
              error: error.message,
            });
          }
        }
      );
    });
  }

  verifyTaxReport(taxReportId: string, publicKeyPem: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.db.get(
        'SELECT * FROM tax_reports WHERE id = ?',
        [taxReportId],
        (err: any, report: any) => {
          if (err || !report) {
            resolve(false);
            return;
          }

          try {
            const payload = JSON.stringify({
              reportId: report.id,
              transactionId: report.transactionId,
              grossAmount: report.grossAmount,
              ivaAmount: report.ivaAmount,
              retentionAmount: report.retentionAmount,
              netAmount: report.netAmount,
              currency: report.currency,
              timestamp: report.signedAt,
            });

            // Verificar firma digital
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(payload);
            const isValid = verify.verify(publicKeyPem, report.signature, 'hex');

            // Verificar proof SHA-256
            const expectedProof = crypto
              .createHash('sha256')
              .update(payload + report.signature)
              .digest('hex');
            const proofValid = expectedProof === report.proof;

            resolve(isValid && proofValid);
          } catch {
            resolve(false);
          }
        }
      );
    }) as Promise<boolean>;
  }

  getTaxReport(taxReportId: string): Promise<TaxReport | null> {
    return new Promise((resolve) => {
      this.db.get(
        'SELECT * FROM tax_reports WHERE id = ?',
        [taxReportId],
        (err: any, report: any) => {
          resolve(err ? null : (report as TaxReport));
        }
      );
    });
  }

  getTaxReportsByTransaction(transactionId: string): Promise<TaxReport[]> {
    return new Promise((resolve) => {
      this.db.all(
        'SELECT * FROM tax_reports WHERE transactionId = ? ORDER BY signedAt DESC',
        [transactionId],
        (err: any, reports: any[]) => {
          resolve(err ? [] : (reports as TaxReport[]));
        }
      );
    });
  }

  getUnreportedTaxReports(): Promise<TaxReport[]> {
    return new Promise((resolve) => {
      this.db.all(
        'SELECT * FROM tax_reports WHERE reportedToSRI = 0 ORDER BY signedAt ASC',
        (err: any, reports: any[]) => {
          resolve(err ? [] : (reports as TaxReport[]));
        }
      );
    });
  }

  getSRIReportStatus(taxReportId: string): Promise<any> {
    return new Promise((resolve) => {
      this.db.get(
        `SELECT sr.*, tr.transactionId, tr.grossAmount, tr.ivaAmount, tr.retentionAmount, tr.netAmount
         FROM sri_reports sr
         JOIN tax_reports tr ON sr.taxReportId = tr.id
         WHERE sr.taxReportId = ?`,
        [taxReportId],
        (err: any, report: any) => {
          resolve(
            err
              ? null
              : {
                  status: report?.status || 'NOT_REPORTED',
                  sriReceiptNumber: report?.sriReceiptNumber,
                  sriResponseCode: report?.sriResponseCode,
                  sriProcessedAt: report?.sriProcessedAt,
                  transactionId: report?.transactionId,
                  amounts: {
                    grossAmount: report?.grossAmount,
                    ivaAmount: report?.ivaAmount,
                    retentionAmount: report?.retentionAmount,
                    netAmount: report?.netAmount,
                  },
                }
          );
        }
      );
    });
  }

  generateComplianceReport(): Promise<{
    totalReports: number;
    reportedToSRI: number;
    pendingSRI: number;
    totalIVA: number;
    totalRetentions: number;
    totalNetAmount: number;
  }> {
    return new Promise((resolve) => {
      this.db.get(
        `SELECT
          COUNT(*) as totalReports,
          SUM(CASE WHEN reportedToSRI = 1 THEN 1 ELSE 0 END) as reportedToSRI,
          SUM(CASE WHEN reportedToSRI = 0 THEN 1 ELSE 0 END) as pendingSRI,
          SUM(ivaAmount) as totalIVA,
          SUM(retentionAmount) as totalRetentions,
          SUM(netAmount) as totalNetAmount
         FROM tax_reports`,
        (err: any, result: any) => {
          resolve(
            err
              ? {
                  totalReports: 0,
                  reportedToSRI: 0,
                  pendingSRI: 0,
                  totalIVA: 0,
                  totalRetentions: 0,
                  totalNetAmount: 0,
                }
              : {
                  totalReports: result?.totalReports || 0,
                  reportedToSRI: result?.reportedToSRI || 0,
                  pendingSRI: result?.pendingSRI || 0,
                  totalIVA: Math.round((result?.totalIVA || 0) * 100) / 100,
                  totalRetentions: Math.round((result?.totalRetentions || 0) * 100) / 100,
                  totalNetAmount: Math.round((result?.totalNetAmount || 0) * 100) / 100,
                }
          );
        }
      );
    });
  }
}
