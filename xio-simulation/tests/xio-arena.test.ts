import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Genome } from '../src/xio-genome';
import { Ledger } from '../src/xio-ledger';
import { Metabolism } from '../src/xio-metabolism';
import { GovernanceEngine, KillSwitch } from '../src/xio-governance';
import { AgentBase, AgentFactory, SalesAgent } from '../src/xio-agent.base';
import { Arena } from '../src/xio-arena';

function buildArena(agentCount: number, maxPopulation: number) {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger, { fixedCost: 1, variableCostPerAction: 1 });
  const governance = new GovernanceEngine(ledger, new KillSwitch(), -1000, 0);
  const factory: AgentFactory = (_role, id, genome) => new SalesAgent(id, genome, ledger, metabolism, 200);
  const agents: AgentBase[] = Array.from({ length: agentCount }, (_, i) => factory('sales', `sales-${i}`, Genome.random()));
  const arena = new Arena(agents, ledger, metabolism, governance, factory, 150, maxPopulation);
  return { arena, ledger };
}

test('runCycle increments cycle count and returns a matching report', () => {
  const { arena } = buildArena(4, 100);
  const report1 = arena.runCycle();
  const report2 = arena.runCycle();
  assert.equal(report1.cycle, 1);
  assert.equal(report2.cycle, 2);
});

test('population never exceeds maxPopulation', () => {
  const { arena } = buildArena(6, 20);
  arena.run(10);
  assert.ok(arena.getAgents().length <= 20);
});

test('kill switch triggered mid-run kills all living agents on the next cycle', () => {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger, { fixedCost: 1, variableCostPerAction: 1 });
  const killSwitch = new KillSwitch();
  const governance = new GovernanceEngine(ledger, killSwitch, -1000, 0);
  const factory: AgentFactory = (_role, id, genome) => new SalesAgent(id, genome, ledger, metabolism, 200);
  const agents: AgentBase[] = Array.from({ length: 3 }, (_, i) => factory('sales', `sales-${i}`, Genome.random()));
  const arena = new Arena(agents, ledger, metabolism, governance, factory, 150, 50);

  arena.runCycle();
  killSwitch.trigger('manual halt');
  const report = arena.runCycle();

  assert.equal(report.aliveCount, 0);
  assert.equal(arena.getAgents().every((a) => !a.alive), true);
});

test('ledger stays verifiably intact after a full run', () => {
  const { arena, ledger } = buildArena(4, 30);
  arena.run(8);
  assert.equal(ledger.verifyIntegrity(), true);
});
