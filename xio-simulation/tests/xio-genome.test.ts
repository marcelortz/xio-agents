import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Genome, TRAIT_KEYS } from '../src/xio-genome';

test('random genome has all traits within [0, 1]', () => {
  const genome = Genome.random();
  for (const key of TRAIT_KEYS) {
    assert.ok(genome.traits[key] >= 0 && genome.traits[key] <= 1, `${key} out of range`);
  }
});

test('specializeFor applies role bias and clamps to [0, 1]', () => {
  const genome = new Genome({ efficiency: 0, riskTolerance: 1, creativity: 0.5, resilience: 0.5, speed: 0.5 });
  const legal = genome.specializeFor('legal');
  assert.ok(legal.traits.resilience > genome.traits.resilience);
  assert.ok(legal.traits.riskTolerance <= 1 && legal.traits.riskTolerance >= 0);
});

test('mutate keeps traits within [0, 1]', () => {
  const genome = new Genome({ efficiency: 1, riskTolerance: 0, creativity: 1, resilience: 0, speed: 1 });
  const mutated = genome.mutate(0.5);
  for (const key of TRAIT_KEYS) {
    assert.ok(mutated.traits[key] >= 0 && mutated.traits[key] <= 1, `${key} out of range after mutate`);
  }
});

test('crossover increments generation and inherits from both parents', () => {
  const parentA = new Genome({ efficiency: 1, riskTolerance: 1, creativity: 1, resilience: 1, speed: 1 }, 2);
  const parentB = new Genome({ efficiency: 0, riskTolerance: 0, creativity: 0, resilience: 0, speed: 0 }, 3);
  const child = Genome.crossover(parentA, parentB, 0);
  assert.equal(child.generation, 4);
  for (const key of TRAIT_KEYS) {
    assert.ok(child.traits[key] === 0 || child.traits[key] === 1, `${key} should inherit exactly from a parent`);
  }
});

test('fitness averages trait values', () => {
  const genome = new Genome({ efficiency: 1, riskTolerance: 1, creativity: 1, resilience: 1, speed: 1 });
  assert.equal(genome.fitness(), 1);
});
