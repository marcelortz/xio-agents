import { Ledger, LedgerEntry } from './xio-ledger';

export enum GovernanceLayer {
  SELF_CHECK = 'self_check',
  PEER_REVIEW = 'peer_review',
  ARENA_OVERSIGHT = 'arena_oversight',
  KILL_SWITCH = 'kill_switch',
}

export interface GovernanceDecision {
  approved: boolean;
  layer: GovernanceLayer;
  reason: string;
}

export interface GovernableAgent {
  id: string;
  balance: number;
  alive: boolean;
}

export class KillSwitch {
  private triggered = false;
  private reason = '';

  trigger(reason: string): void {
    this.triggered = true;
    this.reason = reason;
  }

  reset(): void {
    this.triggered = false;
    this.reason = '';
  }

  isActive(): boolean {
    return this.triggered;
  }

  getReason(): string {
    return this.reason;
  }
}

export class GovernanceEngine {
  constructor(
    private readonly ledger: Ledger,
    private readonly killSwitch: KillSwitch = new KillSwitch(),
    private readonly bankruptcyThreshold = -50,
    private readonly peerReviewSampleRate = 0.1,
  ) {}

  evaluate(agent: GovernableAgent): GovernanceDecision {
    const decision =
      this.checkKillSwitch() ??
      this.checkSelfBalance(agent) ??
      this.checkPeerReview(agent) ??
      this.checkArenaOversight(agent) ?? {
        approved: true,
        layer: GovernanceLayer.ARENA_OVERSIGHT,
        reason: 'all layers passed',
      };

    this.ledger.append({
      agentId: agent.id,
      type: 'governance',
      amount: 0,
      metadata: { layer: decision.layer, approved: decision.approved, reason: decision.reason },
    });

    return decision;
  }

  triggerKillSwitch(reason: string): void {
    this.killSwitch.trigger(reason);
  }

  resetKillSwitch(): void {
    this.killSwitch.reset();
  }

  auditTrail(agentId?: string): LedgerEntry[] {
    return this.ledger.getHistory(agentId).filter((e) => e.type === 'governance');
  }

  private checkKillSwitch(): GovernanceDecision | null {
    if (!this.killSwitch.isActive()) return null;
    return { approved: false, layer: GovernanceLayer.KILL_SWITCH, reason: this.killSwitch.getReason() };
  }

  private checkSelfBalance(agent: GovernableAgent): GovernanceDecision | null {
    if (agent.balance >= this.bankruptcyThreshold) return null;
    return {
      approved: false,
      layer: GovernanceLayer.SELF_CHECK,
      reason: `balance ${agent.balance.toFixed(2)} below bankruptcy threshold ${this.bankruptcyThreshold}`,
    };
  }

  private checkPeerReview(agent: GovernableAgent): GovernanceDecision | null {
    if (Math.random() >= this.peerReviewSampleRate) return null;
    const pressure = this.ledger.financialPressure(agent.id);
    if (pressure.level !== 'critical') return null;
    return {
      approved: false,
      layer: GovernanceLayer.PEER_REVIEW,
      reason: 'flagged in random audit: critical financial pressure',
    };
  }

  private checkArenaOversight(agent: GovernableAgent): GovernanceDecision | null {
    const integrityOk = this.ledger.verifyIntegrity();
    if (integrityOk) return null;
    return {
      approved: false,
      layer: GovernanceLayer.ARENA_OVERSIGHT,
      reason: 'ledger integrity check failed',
    };
  }
}
