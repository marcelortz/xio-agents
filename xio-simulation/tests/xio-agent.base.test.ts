import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Genome } from '../src/xio-genome';
import { Ledger } from '../src/xio-ledger';
import { Metabolism } from '../src/xio-metabolism';
import { LegalAgent, SalesAgent } from '../src/xio-agent.base';

function setup(startingBalance = 100) {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger, { fixedCost: 5, variableCostPerAction: 2 });
  return { ledger, metabolism, startingBalance };
}

test('LegalAgent.act scales revenue with efficiency and risk tolerance', () => {
  const { ledger, metabolism, startingBalance } = setup();
  const genome = new Genome({ efficiency: 1, riskTolerance: 1, creativity: 0, resilience: 1, speed: 0 });
  const agent = new LegalAgent('legal-1', genome, ledger, metabolism, startingBalance);
  const result = agent.act();
  assert.equal(result.actions, 4);
  assert.ok(result.revenue > 0);
});

test('tick applies cost and revenue to balance and increments age', () => {
  const { ledger, metabolism, startingBalance } = setup();
  const genome = Genome.random();
  const agent = new SalesAgent('sales-1', genome, ledger, metabolism, startingBalance);
  agent.tick();
  assert.equal(agent.age, 1);
  assert.notEqual(agent.balance, startingBalance);
});

test('tick is a no-op once the agent has died', () => {
  const { ledger, metabolism, startingBalance } = setup();
  const agent = new SalesAgent('sales-1', Genome.random(), ledger, metabolism, startingBalance);
  agent.die('test');
  agent.tick();
  assert.equal(agent.age, 0);
  assert.equal(agent.balance, startingBalance);
});

test('die is idempotent and records exactly one ledger entry', () => {
  const { ledger, metabolism, startingBalance } = setup();
  const agent = new SalesAgent('sales-1', Genome.random(), ledger, metabolism, startingBalance);
  agent.die('bankrupt');
  agent.die('bankrupt again');
  assert.equal(agent.alive, false);
  assert.equal(ledger.getHistory('sales-1').filter((e) => e.type === 'death').length, 1);
});

test('canReproduce requires the agent to be alive and above the threshold', () => {
  const { ledger, metabolism } = setup(200);
  const agent = new SalesAgent('sales-1', Genome.random(), ledger, metabolism, 200);
  assert.equal(agent.canReproduce(150), true);
  agent.die('test');
  assert.equal(agent.canReproduce(150), false);
});

test('reproduceWith deducts balance from both parents and returns a child genome', () => {
  const { ledger, metabolism } = setup(200);
  const parentA = new SalesAgent('sales-1', Genome.random(), ledger, metabolism, 200);
  const parentB = new SalesAgent('sales-2', Genome.random(), ledger, metabolism, 200);
  const childGenome = parentA.reproduceWith(parentB);
  assert.equal(parentA.balance, 150);
  assert.equal(parentB.balance, 150);
  assert.ok(childGenome.generation > Math.max(parentA.genome.generation, parentB.genome.generation) - 1);
});
