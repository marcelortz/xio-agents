import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ledger } from '../src/xio-ledger';

test('append chains entries by hash and verifies as intact', () => {
  const ledger = new Ledger();
  ledger.append({ agentId: 'a1', type: 'income', amount: 100 });
  ledger.append({ agentId: 'a1', type: 'expense', amount: 30 });
  assert.equal(ledger.verifyIntegrity(), true);
  const history = ledger.getHistory('a1');
  assert.equal(history.length, 2);
  assert.equal(history[1].prevHash, history[0].hash);
});

test('tampering with an entry breaks integrity verification', () => {
  const ledger = new Ledger();
  ledger.append({ agentId: 'a1', type: 'income', amount: 100 });
  const entry = ledger.getHistory('a1')[0];
  // @ts-expect-error intentionally mutating a readonly field to simulate tampering
  entry.amount = 999999;
  assert.equal(ledger.verifyIntegrity(), false);
});

test('getBalance nets income against expenses and deaths', () => {
  const ledger = new Ledger();
  ledger.append({ agentId: 'a1', type: 'income', amount: 100 });
  ledger.append({ agentId: 'a1', type: 'expense', amount: 40 });
  assert.equal(ledger.getBalance('a1'), 60);
});

test('financialPressure reports low when net flow is positive', () => {
  const ledger = new Ledger();
  ledger.append({ agentId: 'a1', type: 'income', amount: 100 });
  ledger.append({ agentId: 'a1', type: 'expense', amount: 10 });
  const pressure = ledger.financialPressure('a1');
  assert.equal(pressure.level, 'low');
});

test('financialPressure escalates as burn outpaces income', () => {
  const ledger = new Ledger();
  for (let i = 0; i < 9; i++) ledger.append({ agentId: 'a1', type: 'expense', amount: 50 });
  const pressure = ledger.financialPressure('a1');
  assert.equal(pressure.level, 'critical');
  assert.ok(pressure.netFlow < 0);
});
