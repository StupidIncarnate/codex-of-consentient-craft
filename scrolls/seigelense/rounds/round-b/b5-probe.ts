// Diagnostic probe only — not a B5 case. Forces TS to print the real inferred type of
// `g[0].subagents` via a deliberate assignment mismatch, to explain WHY
// `g[0].subagents.add(...)` fails with TS2532 ("Object is possibly undefined") rather than
// TS2339 ("Property does not exist").
import { dmRegistryBroker } from '../../packages/siegelense-recipes/src/brokers/dm/registry/dm-registry-broker';

export const probeOps = dmRegistryBroker.guilds.add(1, (g) => {
  const probe: 'INTENTIONAL_TYPE_PROBE' = g[0].subagents;
  return [probe as never];
});
