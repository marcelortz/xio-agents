import { AgentBase, AgentFactory } from './xio-agent.base';
import { GovernanceEngine } from './xio-governance';
import { Ledger } from './xio-ledger';
import { Metabolism } from './xio-metabolism';

export interface CycleReport {
  cycle: number;
  aliveCount: number;
  deadCount: number;
  totalBalance: number;
  births: number;
  kills: number;
  events: string[];
}

export class Arena {
  private cycle = 0;
  private agents: AgentBase[];
  private reports: CycleReport[] = [];

  constructor(
    initialAgents: AgentBase[],
    private readonly ledger: Ledger,
    private readonly metabolism: Metabolism,
    private readonly governance: GovernanceEngine,
    private readonly agentFactory: AgentFactory,
    private readonly reproductionThreshold = 150,
    private readonly maxPopulation = 200,
  ) {
    this.agents = initialAgents;
  }

  runCycle(): CycleReport {
    this.cycle++;
    const events: string[] = [];

    // Phase 1: Perception — agents observe current arena state (hook for future sensing logic).
    const alivePreTick = this.agents.filter((a) => a.alive);

    // Phase 2: Action — each living agent performs its role-specific work.
    for (const agent of alivePreTick) agent.tick();

    // Phase 3: Metabolism — costs/gains already applied inside tick(); death risk is assessed here.
    for (const agent of alivePreTick) {
      if (!agent.alive) continue;
      const prediction = this.metabolism.predictDeath(agent.id, agent.balance);
      if (prediction.risk === 'critical' && agent.balance <= 0) {
        agent.die('metabolic exhaustion');
        events.push(`${agent.id} died: metabolic exhaustion`);
      }
    }

    // Phase 4: Governance — 4-layer review, may kill agents that fail compliance.
    let kills = 0;
    for (const agent of this.agents) {
      if (!agent.alive) continue;
      const decision = this.governance.evaluate({ id: agent.id, balance: agent.balance, alive: agent.alive });
      if (!decision.approved) {
        agent.die(`governance:${decision.layer}:${decision.reason}`);
        events.push(`${agent.id} killed by governance (${decision.layer}): ${decision.reason}`);
        kills++;
      }
    }

    // Phase 5: Reproduction — eligible agents pair off and spawn offspring.
    const births = this.handleReproduction(events);

    // Phase 6: Reporting — snapshot arena state for this cycle.
    const report = this.buildReport(events, births, kills);
    this.reports.push(report);
    return report;
  }

  run(cycles: number): CycleReport[] {
    for (let i = 0; i < cycles; i++) this.runCycle();
    return this.reports;
  }

  getAgents(): AgentBase[] {
    return [...this.agents];
  }

  getReports(): CycleReport[] {
    return [...this.reports];
  }

  private handleReproduction(events: string[]): number {
    const eligible = this.agents.filter((a) => a.alive && a.canReproduce(this.reproductionThreshold));
    let births = 0;
    for (let i = 0; i + 1 < eligible.length; i += 2) {
      if (this.agents.length >= this.maxPopulation) break;
      const parentA = eligible[i];
      const parentB = eligible[i + 1];
      const childGenome = parentA.reproduceWith(parentB);
      const childId = `${parentA.role}-${this.cycle}-${births}`;
      const child = this.agentFactory(parentA.role, childId, childGenome);
      this.agents.push(child);
      events.push(`${childId} born from ${parentA.id} x ${parentB.id}`);
      births++;
    }
    return births;
  }

  private buildReport(events: string[], births: number, kills: number): CycleReport {
    const alive = this.agents.filter((a) => a.alive);
    const dead = this.agents.filter((a) => !a.alive);
    return {
      cycle: this.cycle,
      aliveCount: alive.length,
      deadCount: dead.length,
      totalBalance: alive.reduce((sum, a) => sum + a.balance, 0),
      births,
      kills,
      events,
    };
  }
}
