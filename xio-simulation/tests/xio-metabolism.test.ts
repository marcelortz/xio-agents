import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ledger } from '../src/xio-ledger';
import { Metabolism } from '../src/xio-metabolism';

test('chargeCycleCost computes fixed + variable cost and records an expense', () => {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger, { fixedCost: 5, variableCostPerAction: 2 });
  const cost = metabolism.chargeCycleCost('a1', 3);
  assert.equal(cost, 11);
  assert.equal(ledger.getHistory('a1')[0].type, 'expense');
});

test('recordGain ignores non-positive amounts', () => {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger);
  metabolism.recordGain('a1', 0, 'noop');
  metabolism.recordGain('a1', -5, 'invalid');
  assert.equal(ledger.getHistory('a1').length, 0);
});

test('predictDeath returns none risk when balance is growing', () => {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger);
  metabolism.recordGain('a1', 200, 'sale');
  const prediction = metabolism.predictDeath('a1', 200);
  assert.equal(prediction.risk, 'none');
  assert.equal(prediction.cyclesRemaining, Infinity);
});

test('predictDeath escalates risk as burn rate consumes balance', () => {
  const ledger = new Ledger();
  const metabolism = new Metabolism(ledger, { fixedCost: 20, variableCostPerAction: 0 });
  for (let i = 0; i < 3; i++) metabolism.chargeCycleCost('a1', 0);
  const prediction = metabolism.predictDeath('a1', 15);
  assert.ok(prediction.cyclesRemaining <= 1);
  assert.equal(prediction.risk, 'critical');
});
