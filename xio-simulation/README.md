# XIO

Simulación de agentes económicos con genética, metabolismo financiero y gobernanza multicapa, escrita en TypeScript strict mode.

## Arquitectura

```
src/xio-genome.ts        Traits, mutación, cruce (crossover), especialización por rol
src/xio-ledger.ts        Ledger inmutable encadenado por SHA-256, presión financiera
src/xio-metabolism.ts    Costes por ciclo, ingresos, predicción de muerte por burn rate
src/xio-governance.ts    4 capas de control: self-check, peer review, arena oversight, kill switch
src/xio-agent.base.ts    Clase base AgentBase + ejemplos LegalAgent, SalesAgent
src/xio-arena.ts         Simulador de ciclos (6 fases) con reproducción y cap de población
src/xio-simulation.ts    Orquestador: bootstrap, run, exportación de auditoría
bin/run-simulation.ts    CLI de ejecución
tests/                   Suite de tests (node:test) por módulo
```

### Ciclo de la arena (6 fases)

1. **Percepción** — snapshot de agentes vivos al inicio del ciclo.
2. **Acción** — cada agente ejecuta su lógica de rol (`act()`).
3. **Metabolismo** — se cobran costes/ingresos y se evalúa riesgo de muerte.
4. **Gobernanza** — las 4 capas evalúan a cada agente vivo; puede terminar en muerte.
5. **Reproducción** — agentes elegibles se emparejan y generan descendencia (con cap de población).
6. **Reporte** — se construye un `CycleReport` con el estado del ciclo.

### Gobernanza (4 capas)

| Capa | Qué revisa |
|---|---|
| `self_check` | Balance del agente vs. umbral de bancarrota |
| `peer_review` | Auditoría aleatoria sobre presión financiera crítica |
| `arena_oversight` | Integridad del ledger (verificación de la cadena SHA-256) |
| `kill_switch` | Corte de emergencia manual, deniega a todos los agentes mientras esté activo |

Cada evaluación de gobernanza queda registrada en el ledger (`type: 'governance'`), formando un audit trail consultable con `GovernanceEngine.auditTrail()`.

### Ledger

Cada entrada incluye `prevHash` y un `hash` SHA-256 calculado sobre su propio contenido + el hash anterior, formando una cadena verificable con `Ledger.verifyIntegrity()`. Cualquier alteración posterior a una entrada rompe la cadena y la verificación falla.

## Requisitos

- Node.js 18+ (probado en v22)
- npm

## Instalación

```bash
npm install
```

## Uso

### Ejecutar la simulación (CLI)

```bash
npm run build
npm start -- <cycles> <agentsPerRole>

# o en desarrollo, sin build previo:
npm run dev -- 20 4
```

Ejemplo:

```bash
npm run dev -- 15 3
```

Imprime, por ciclo: agentes vivos/muertos, balance total, nacimientos, muertes, y los eventos (nacimientos, muertes, decisiones de gobernanza). Al final reporta si el ledger quedó íntegro y el tamaño de la población final.

### Uso programático

```ts
import { Simulation } from './src/xio-simulation';

const sim = new Simulation({
  roles: ['legal', 'sales'],
  agentsPerRole: 5,
  cycles: 30,
  startingBalance: 100,
  costModel: { fixedCost: 5, variableCostPerAction: 2 },
  reproductionThreshold: 150,
  maxPopulation: 60,
});

sim.bootstrap();
const reports = sim.run();
const audit = sim.exportAudit(); // { verified, ledger, reports, finalPopulation }
```

## Tests

```bash
npm test
```

Corre `tsc` y luego la suite completa con el test runner nativo de Node (`node --test`). Cobertura por módulo: genoma (rangos y herencia), ledger (integridad de cadena y detección de manipulación), metabolismo (costes y predicción de muerte), gobernanza (las 4 capas y el kill switch), agentes (ciclo de vida y reproducción), arena (cap de población, integración de gobernanza) y simulación end-to-end.

## Extender

- **Nuevos roles de agente**: crear una subclase de `AgentBase` implementando `act()`, y registrarla en `AGENT_CONSTRUCTORS` (`src/xio-simulation.ts`).
- **Nuevas capas de gobernanza**: añadir un método privado a `GovernanceEngine` y encadenarlo en `evaluate()`.
- **Otros traits genéticos**: agregar la clave a la interfaz `Traits` y a `TRAIT_KEYS` en `src/xio-genome.ts`.
