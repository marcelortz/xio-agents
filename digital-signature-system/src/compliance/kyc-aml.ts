import * as crypto from 'crypto';

export interface Client {
  id: string;
  cedula: string; // Cédula Ecuador
  fullName: string;
  email: string;
  phone: string;
  address: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';
  amlStatus: 'CLEAN' | 'FLAGGED' | 'BLOCKED' | 'REPORTED';
  verifiedAt?: Date;
  riskScore: number; // 0-100 (0 = low risk, 100 = high risk)
  createdAt: Date;
  lastActivityAt?: Date;
  transactionCount: number;
  totalVolume: number;
  averageTransaction: number;
}

export interface AMLFlag {
  id: string;
  clientId: string;
  type: 'SPIKE_DETECTION' | 'CIRCULAR_FLOW' | 'STRUCTURING' | 'SUSPICIOUS_PATTERN' | 'VELOCITY';
  description: string;
  flaggedAmount?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REPORTED_UIF';
  flaggedAt: Date;
  reportedToUIF?: Date;
}

export class KYCManager {
  private clients: Map<string, Client> = new Map();

  /**
   * Verificar identidad del cliente (Cédula Ecuador)
   * En producción, conectar con API de SENESCYT o similar
   */
  async verifyIdentity(cedula: string, fullName: string): Promise<boolean> {
    try {
      // Validar formato cédula (10 dígitos)
      if (!/^\d{10}$/.test(cedula)) {
        return false;
      }

      // Validar dígito verificador (algoritmo Ecuador)
      const verificador = this.calculateEcuadorVerificationDigit(cedula.substring(0, 9));
      if (parseInt(cedula[9]) !== verificador) {
        return false;
      }

      // En producción: Verificar contra SENESCYT API
      // const senescytResponse = await this.querySENESCYT(cedula, fullName);
      // return senescytResponse.isValid;

      return true;
    } catch (error) {
      return false;
    }
  }

  private calculateEcuadorVerificationDigit(nineDigits: string): number {
    const multipliers = [2, 3, 4, 5, 6, 7, 8, 9, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(nineDigits[i]) * multipliers[i];
    }

    const remainder = sum % 11;
    const digit = remainder === 0 ? 0 : 11 - remainder;
    return digit === 10 ? 1 : digit;
  }

  registerClient(cedula: string, fullName: string, email: string, phone: string, address: string): Client {
    const clientId = `CLI-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const client: Client = {
      id: clientId,
      cedula,
      fullName,
      email,
      phone,
      address,
      kycStatus: 'PENDING',
      amlStatus: 'CLEAN',
      riskScore: 50, // Neutral por defecto
      createdAt: new Date(),
      transactionCount: 0,
      totalVolume: 0,
      averageTransaction: 0,
    };

    this.clients.set(clientId, client);
    return client;
  }

  markKYCVerified(clientId: string): Client | null {
    const client = this.clients.get(clientId);
    if (!client) return null;

    client.kycStatus = 'VERIFIED';
    client.verifiedAt = new Date();
    client.riskScore = Math.max(0, client.riskScore - 20); // Reducir riesgo

    this.clients.set(clientId, client);
    return client;
  }

  getClient(clientId: string): Client | null {
    return this.clients.get(clientId) || null;
  }

  getClientByCedula(cedula: string): Client | null {
    for (const client of this.clients.values()) {
      if (client.cedula === cedula) return client;
    }
    return null;
  }
}

export class AMLEngine {
  private flags: Map<string, AMLFlag> = new Map();
  private spikeThreshold = 3.0; // 3x el promedio = spike
  private maxStructuringTransactions = 5; // Múltiples < límite en 24h
  private structuringTimeWindow = 24 * 60 * 60 * 1000; // 24 horas
  private structuringAmountLimit = 100; // €100 por transacción

  /**
   * Detección de spike: transacción > 3x el promedio del cliente
   */
  detectSpike(client: Client, newTransactionAmount: number): AMLFlag | null {
    if (client.transactionCount < 3) {
      return null; // Necesitar al menos 3 transacciones para establecer patrón
    }

    const averageTransaction = client.totalVolume / client.transactionCount;
    const spikeAmount = averageTransaction * this.spikeThreshold;

    if (newTransactionAmount > spikeAmount) {
      const flagId = `FLAG-SPIKE-${Date.now()}`;
      const flag: AMLFlag = {
        id: flagId,
        clientId: client.id,
        type: 'SPIKE_DETECTION',
        description: `Transacción inusualmente alta: €${newTransactionAmount} (promedio: €${averageTransaction.toFixed(2)})`,
        flaggedAmount: newTransactionAmount,
        severity: this.calculateSpikeSeverity(newTransactionAmount, spikeAmount),
        status: 'OPEN',
        flaggedAt: new Date(),
      };

      this.flags.set(flagId, flag);
      return flag;
    }

    return null;
  }

  private calculateSpikeSeverity(amount: number, threshold: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ratio = amount / threshold;
    if (ratio < 1.5) return 'LOW';
    if (ratio < 2.0) return 'MEDIUM';
    if (ratio < 3.0) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Detección de circular flows: A → B → A en corto tiempo
   */
  detectCircularFlow(senderId: string, recipientId: string, recentTransactions: any[]): AMLFlag | null {
    // Buscar transacción inversa en últimas 24 horas
    const timeWindow = Date.now() - 24 * 60 * 60 * 1000;

    for (const tx of recentTransactions) {
      if (
        tx.senderId === recipientId &&
        tx.recipientId === senderId &&
        new Date(tx.timestamp).getTime() > timeWindow &&
        tx.status === 'EXECUTED'
      ) {
        const flagId = `FLAG-CIRCULAR-${Date.now()}`;
        const flag: AMLFlag = {
          id: flagId,
          clientId: senderId,
          type: 'CIRCULAR_FLOW',
          description: `Flujo circular detectado: ${senderId} → ${recipientId} → ${senderId} en 24 horas`,
          severity: 'HIGH',
          status: 'OPEN',
          flaggedAt: new Date(),
        };

        this.flags.set(flagId, flag);
        return flag;
      }
    }

    return null;
  }

  /**
   * Detección de structuring: múltiples transacciones < límite para evadir reportes
   */
  detectStructuring(clientId: string, recentTransactions: any[]): AMLFlag | null {
    const timeWindow = Date.now() - this.structuringTimeWindow;
    const suspiciousTransactions = recentTransactions.filter(
      (tx) =>
        tx.senderId === clientId &&
        tx.amount <= this.structuringAmountLimit &&
        new Date(tx.timestamp).getTime() > timeWindow
    );

    if (suspiciousTransactions.length >= this.maxStructuringTransactions) {
      const totalAmount = suspiciousTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const flagId = `FLAG-STRUCTURING-${Date.now()}`;
      const flag: AMLFlag = {
        id: flagId,
        clientId,
        type: 'STRUCTURING',
        description: `Patrón de estructuración detectado: ${suspiciousTransactions.length} transacciones de €${this.structuringAmountLimit} o menos en 24 horas (total: €${totalAmount})`,
        flaggedAmount: totalAmount,
        severity: 'HIGH',
        status: 'OPEN',
        flaggedAt: new Date(),
      };

      this.flags.set(flagId, flag);
      return flag;
    }

    return null;
  }

  /**
   * Calcular risk score basado en actividad
   */
  calculateRiskScore(client: Client, flags: AMLFlag[]): number {
    let score = client.riskScore;

    // Bonificación si está verificado KYC
    if (client.kycStatus === 'VERIFIED') {
      score = Math.max(0, score - 10);
    }

    // Penalización por cada flag
    for (const flag of flags) {
      if (flag.clientId === client.id && flag.status !== 'RESOLVED') {
        switch (flag.severity) {
          case 'LOW':
            score += 5;
            break;
          case 'MEDIUM':
            score += 15;
            break;
          case 'HIGH':
            score += 30;
            break;
          case 'CRITICAL':
            score += 50;
            break;
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * Decidir si bloquear transacción basado en risk score y KYC status
   */
  shouldBlockTransaction(client: Client, riskScore: number): { shouldBlock: boolean; reason?: string } {
    // KYC no verificado y monto alto
    if (client.kycStatus !== 'VERIFIED' && riskScore > 70) {
      return {
        shouldBlock: true,
        reason: 'KYC no verificado y risk score alto (> 70)',
      };
    }

    // AML bloqueado
    if (client.amlStatus === 'BLOCKED') {
      return {
        shouldBlock: true,
        reason: 'Cliente bloqueado por AML',
      };
    }

    // Risk score crítico
    if (riskScore > 85) {
      return {
        shouldBlock: true,
        reason: 'Risk score crítico (> 85)',
      };
    }

    return { shouldBlock: false };
  }

  /**
   * Reportar a UIF (Unidad de Inteligencia Financiera)
   */
  reportToUIF(flagId: string, clientId: string, reason: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;

    // En producción: Enviar REPORTE a API de UIF
    // const uifReport = {
    //   clientId,
    //   cédula: client.cedula,
    //   reason,
    //   timestamp: new Date(),
    //   severity: flag.severity
    // };
    // await this.sendToUIF(uifReport);

    flag.status = 'REPORTED_UIF';
    flag.reportedToUIF = new Date();
    this.flags.set(flagId, flag);

    console.log(`🚨 REPORTE UIF: Cliente ${clientId} - ${reason}`);
    return true;
  }

  getFlag(flagId: string): AMLFlag | null {
    return this.flags.get(flagId) || null;
  }

  getFlagsByClient(clientId: string): AMLFlag[] {
    return Array.from(this.flags.values()).filter((f) => f.clientId === clientId);
  }

  getAllActiveFlags(): AMLFlag[] {
    return Array.from(this.flags.values()).filter((f) => f.status === 'OPEN');
  }
}

export default { KYCManager, AMLEngine };
