import { createHash } from 'node:crypto';

export type LedgerEntryType = 'income' | 'expense' | 'reproduction' | 'death' | 'governance';

export interface LedgerEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly agentId: string;
  readonly type: LedgerEntryType;
  readonly amount: number;
  readonly metadata: Record<string, unknown>;
  readonly prevHash: string;
  readonly hash: string;
}

export type FinancialPressureLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FinancialPressure {
  level: FinancialPressureLevel;
  netFlow: number;
  burnRate: number;
}

const GENESIS_HASH = '0'.repeat(64);

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export class Ledger {
  private entries: LedgerEntry[] = [];
  private sequence = 0;

  append(entry: {
    agentId: string;
    type: LedgerEntryType;
    amount: number;
    metadata?: Record<string, unknown>;
  }): LedgerEntry {
    const prevHash = this.entries.length > 0 ? this.entries[this.entries.length - 1].hash : GENESIS_HASH;
    const id = `L-${++this.sequence}`;
    const timestamp = Date.now();
    const metadata = entry.metadata ?? {};
    const payload = JSON.stringify({ id, timestamp, agentId: entry.agentId, type: entry.type, amount: entry.amount, metadata, prevHash });
    const hash = sha256(payload);
    const record: LedgerEntry = { id, timestamp, agentId: entry.agentId, type: entry.type, amount: entry.amount, metadata, prevHash, hash };
    this.entries.push(record);
    return record;
  }

  verifyIntegrity(): boolean {
    let prevHash = GENESIS_HASH;
    for (const entry of this.entries) {
      if (entry.prevHash !== prevHash) return false;
      const payload = JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        agentId: entry.agentId,
        type: entry.type,
        amount: entry.amount,
        metadata: entry.metadata,
        prevHash: entry.prevHash,
      });
      if (sha256(payload) !== entry.hash) return false;
      prevHash = entry.hash;
    }
    return true;
  }

  getBalance(agentId: string): number {
    return this.entries
      .filter((e) => e.agentId === agentId)
      .reduce((sum, e) => sum + this.signedAmount(e), 0);
  }

  financialPressure(agentId: string, windowCycles = 10): FinancialPressure {
    const recent = this.entries
      .filter((e) => e.agentId === agentId && (e.type === 'income' || e.type === 'expense'))
      .slice(-windowCycles);
    const netFlow = recent.reduce((sum, e) => sum + this.signedAmount(e), 0);
    const expenses = recent.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const burnRate = recent.length > 0 ? expenses / recent.length : 0;
    let level: FinancialPressureLevel = 'low';
    if (netFlow < 0 && burnRate > 0) {
      const severity = Math.abs(netFlow) / (burnRate || 1);
      if (severity > 8) level = 'critical';
      else if (severity > 4) level = 'high';
      else level = 'medium';
    }
    return { level, netFlow, burnRate };
  }

  getHistory(agentId?: string): LedgerEntry[] {
    return agentId ? this.entries.filter((e) => e.agentId === agentId) : [...this.entries];
  }

  private signedAmount(entry: LedgerEntry): number {
    return entry.type === 'expense' || entry.type === 'death' ? -entry.amount : entry.amount;
  }
}
