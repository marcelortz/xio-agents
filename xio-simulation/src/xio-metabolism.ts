import { Ledger } from './xio-ledger';

export interface CostModel {
  fixedCost: number;
  variableCostPerAction: number;
}

export type DeathRisk = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface DeathPrediction {
  cyclesRemaining: number;
  risk: DeathRisk;
}

const DEFAULT_COST_MODEL: CostModel = { fixedCost: 5, variableCostPerAction: 2 };

export class Metabolism {
  constructor(
    private readonly ledger: Ledger,
    private readonly costModel: CostModel = DEFAULT_COST_MODEL,
  ) {}

  chargeCycleCost(agentId: string, actionsThisCycle: number): number {
    const total = this.costModel.fixedCost + this.costModel.variableCostPerAction * actionsThisCycle;
    this.ledger.append({
      agentId,
      type: 'expense',
      amount: total,
      metadata: { actionsThisCycle, costModel: this.costModel },
    });
    return total;
  }

  recordGain(agentId: string, amount: number, source: string): void {
    if (amount <= 0) return;
    this.ledger.append({ agentId, type: 'income', amount, metadata: { source } });
  }

  predictDeath(agentId: string, currentBalance: number): DeathPrediction {
    const pressure = this.ledger.financialPressure(agentId);
    if (pressure.burnRate <= 0 || pressure.netFlow >= 0) {
      return { cyclesRemaining: Infinity, risk: 'none' };
    }
    const cyclesRemaining = Math.max(0, currentBalance / pressure.burnRate);
    let risk: DeathRisk = 'low';
    if (cyclesRemaining <= 1) risk = 'critical';
    else if (cyclesRemaining <= 3) risk = 'high';
    else if (cyclesRemaining <= 6) risk = 'medium';
    return { cyclesRemaining, risk };
  }
}

export { DEFAULT_COST_MODEL };
