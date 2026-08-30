/**
 * PURPOSE: Catalog of the three orchestration smoketest scenarios — each couples the minimal blueprint
 * with a per-role script of canned prompt names and a final-state assertion. Every scenario drives the
 * reactive operations relay: the scenario driver stamps a canned signal prompt on each pending work
 * item as the relay creates it one at a time (codeweaver -> flowrider -> siegemaster; ward is skipped
 * via the blueprint's skipRoles), and each canned agent signals `complete` with an operationStatus
 * so the orchestrator advances (done) or spawns a pt continuation (partial) until the quest completes.
 *
 * USAGE:
 * smoketestScenariosStatics.orchHappyPath;
 * // Returns the SmoketestScenario literal for the happy-path case (validated against the contract via the colocated test)
 *
 * WHEN-TO-USE: Consumed by smoketestCaseCatalogStatics.orchestration, which SmoketestRunResponder
 * hydrates and drives end-to-end through the real dispatch + signal-back routing.
 * WHEN-NOT-TO-USE: MCP / Signals suites that do not exercise the work-item loop.
 *
 * NOTE: Scenario values are literal — statics/ cannot import the zod contract. The colocated test
 * asserts each scenario's shape so drift surfaces immediately. There is no failure signal in the
 * relay model: an agent only ever signals `complete`. The scenarios differ by which reached role
 * their assertion pins, plus one that exercises duplicate-on-partial (a codeweaver pt continuation);
 * the whole relay converging to `complete` is the shared invariant.
 */

import { smoketestBlueprintsStatics } from '../smoketest-blueprints/smoketest-blueprints-statics';

// Every relay role that receives a scripted agent work item once ward is skipped. The scenario
// driver dispenses these per role, one per work item, as the relay creates them in order. Each role
// signals `complete` (operationStatus done) so the orchestrator advances to the next operation item.
//
// The `flowrider` entry is dispensed only because the blueprint's flow is `runtime` — the tail's
// flow fan-out cuts each seed over the flow types its own track measures, and flowrider measures
// that type alone. All three scenarios script the role, so an operational blueprint would leave
// this entry undispensed in every one of them and `orchReachesFlowrider`'s work-item assertion
// unsatisfiable. The `flowType` line in the blueprint carries the reason; do not change it without
// reading these scripts.
const relayScripts = {
  codeweaver: ['signalDone'],
  flowrider: ['signalDone'],
  siegemaster: ['signalDone'],
};

export const smoketestScenariosStatics = {
  orchHappyPath: {
    caseId: 'orch-happy-path',
    name: 'Orchestration: feature relay converges to complete',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: relayScripts,
    assertions: [{ kind: 'quest-status', expected: 'complete' }],
  },
  // The codeweaver signals `partial` on its first pass, so the orchestrator marks the operation
  // item complete and appends a "pt N" continuation; a fresh codeweaver work item runs the
  // continuation and signals `done`. Two codeweaver work items over the operation item's life
  // prove duplicate-on-partial dispatched the pt continuation.
  orchCodeweaverPartial: {
    caseId: 'orch-codeweaver-partial',
    name: 'Orchestration: codeweaver partial spawns a pt continuation',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: {
      codeweaver: ['signalPartial', 'signalDone'],
      flowrider: ['signalDone'],
      siegemaster: ['signalDone'],
    },
    assertions: [
      { kind: 'quest-status', expected: 'complete' },
      { kind: 'work-item-role-count', role: 'codeweaver', minCount: 2 },
    ],
  },
  orchReachesFlowrider: {
    caseId: 'orch-reaches-flowrider',
    name: 'Orchestration: relay reaches the flowrider verify role',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: relayScripts,
    assertions: [
      { kind: 'quest-status', expected: 'complete' },
      { kind: 'work-item-role-count', role: 'flowrider', minCount: 1 },
    ],
  },
};
