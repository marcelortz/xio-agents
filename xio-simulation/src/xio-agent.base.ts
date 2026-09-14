import { Genome } from './xio-genome';
import { Ledger } from './xio-ledger';
import { Metabolism } from './xio-metabolism';

export type AgentRole = 'legal' | 'sales' | string;

export interface ActionResult {
  actions: number;
  revenue: number;
}

export abstract class AgentBase {
  public alive = true;
  public age = 0;
  public balance: number;

  constructor(
    public readonly id: string,
    public readonly role: AgentRole,
    public readonly genome: Genome,
    protected readonly ledger: Ledger,
    protected readonly metabolism: Metabolism,
    startingBalance = 100,
  ) {
    this.balance = startingBalance;
  }

  abstract act(): ActionResult;

  tick(): void {
    if (!this.alive) return;
    this.age++;
    const { actions, revenue } = this.act();
    const cost = this.metabolism.chargeCycleCost(this.id, actions);
    this.metabolism.recordGain(this.id, revenue, `${this.role}-action`);
    this.balance += revenue - cost;
  }

  canReproduce(threshold = 150): boolean {
    return this.alive && this.balance >= threshold;
  }

  reproduceWith(partner: AgentBase): Genome {
    this.balance -= 50;
    partner.balance -= 50;
    return Genome.crossover(this.genome, partner.genome);
  }

  die(reason: string): void {
    if (!this.alive) return;
    this.alive = false;
    this.ledger.append({
      agentId: this.id,
      type: 'death',
      amount: Math.max(0, this.balance),
      metadata: { reason, age: this.age },
    });
  }
}

export class LegalAgent extends AgentBase {
  constructor(id: string, genome: Genome, ledger: Ledger, metabolism: Metabolism, startingBalance = 100) {
    super(id, 'legal', genome, ledger, metabolism, startingBalance);
  }

  act(): ActionResult {
    const { efficiency, riskTolerance, resilience } = this.genome.traits;
    const actions = Math.round(1 + efficiency * 3);
    const feePerCase = 20 + riskTolerance * 10 + resilience * 5;
    return { actions, revenue: actions * feePerCase };
  }
}

export class SalesAgent extends AgentBase {
  constructor(id: string, genome: Genome, ledger: Ledger, metabolism: Metabolism, startingBalance = 100) {
    super(id, 'sales', genome, ledger, metabolism, startingBalance);
  }

  act(): ActionResult {
    const { creativity, speed, riskTolerance } = this.genome.traits;
    const actions = Math.round(2 + speed * 4);
    const closeRate = 0.3 + creativity * 0.4 + riskTolerance * 0.2;
    const dealSize = 15 + creativity * 20;
    return { actions, revenue: actions * closeRate * dealSize };
  }
}

export type AgentFactory = (role: AgentRole, id: string, genome: Genome) => AgentBase;
