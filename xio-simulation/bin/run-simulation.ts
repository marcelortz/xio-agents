import { Simulation } from '../src/xio-simulation';

function main(): void {
  const cycles = Number(process.argv[2] ?? 20);
  const agentsPerRole = Number(process.argv[3] ?? 4);

  const sim = new Simulation({
    roles: ['legal', 'sales'],
    agentsPerRole,
    cycles,
  });

  sim.bootstrap();
  const reports = sim.run();

  for (const r of reports) {
    console.log(
      `cycle ${r.cycle}: alive=${r.aliveCount} dead=${r.deadCount} balance=${r.totalBalance.toFixed(2)} births=${r.births} kills=${r.kills}`,
    );
    for (const event of r.events) console.log(`  - ${event}`);
  }

  const audit = sim.exportAudit();
  console.log(`\nledger integrity verified: ${audit.verified}`);
  console.log(`final population: ${audit.finalPopulation.length} agents (${audit.finalPopulation.filter((a) => a.alive).length} alive)`);
}

main();
