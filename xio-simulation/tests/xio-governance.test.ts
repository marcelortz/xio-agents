import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Ledger } from '../src/xio-ledger';
import { GovernanceEngine, GovernanceLayer, KillSwitch } from '../src/xio-governance';

test('approves a healthy agent with no active kill switch', () => {
  const ledger = new Ledger();
  const governance = new GovernanceEngine(ledger, new KillSwitch(), -50, 0);
  const decision = governance.evaluate({ id: 'a1', balance: 100, alive: true });
  assert.equal(decision.approved, true);
});

test('kill switch denies every agent once triggered', () => {
  const ledger = new Ledger();
  const killSwitch = new KillSwitch();
  const governance = new GovernanceEngine(ledger, killSwitch, -50, 0);
  killSwitch.trigger('emergency stop');
  const decision = governance.evaluate({ id: 'a1', balance: 100, alive: true });
  assert.equal(decision.approved, false);
  assert.equal(decision.layer, GovernanceLayer.KILL_SWITCH);
  assert.equal(decision.reason, 'emergency stop');
});

test('self-check layer denies agents below bankruptcy threshold', () => {
  const ledger = new Ledger();
  const governance = new GovernanceEngine(ledger, new KillSwitch(), -50, 0);
  const decision = governance.evaluate({ id: 'a1', balance: -100, alive: true });
  assert.equal(decision.approved, false);
  assert.equal(decision.layer, GovernanceLayer.SELF_CHECK);
});

test('every evaluation is recorded in the audit trail', () => {
  const ledger = new Ledger();
  const governance = new GovernanceEngine(ledger, new KillSwitch(), -50, 0);
  governance.evaluate({ id: 'a1', balance: 100, alive: true });
  governance.evaluate({ id: 'a1', balance: 50, alive: true });
  assert.equal(governance.auditTrail('a1').length, 2);
});

test('resetKillSwitch restores approvals', () => {
  const ledger = new Ledger();
  const killSwitch = new KillSwitch();
  const governance = new GovernanceEngine(ledger, killSwitch, -50, 0);
  governance.triggerKillSwitch('halt');
  assert.equal(governance.evaluate({ id: 'a1', balance: 100, alive: true }).approved, false);
  governance.resetKillSwitch();
  assert.equal(governance.evaluate({ id: 'a1', balance: 100, alive: true }).approved, true);
});
