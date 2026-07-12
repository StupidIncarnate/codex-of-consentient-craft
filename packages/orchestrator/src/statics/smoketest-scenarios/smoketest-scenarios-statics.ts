/**
 * PURPOSE: Catalog of the five orchestration smoketest scenarios (happy path, codeweaver-fail
 * spiritmender recovery, lawbringer-fail spiritmender, codeweaver replan-loop exhaustion, blightwarden
 * failed-replan) — each couples the minimal blueprint with per-role prompt scripts and final-state
 * assertions. All five exercise the RECOVERY-FIRST model: a `failed` (code) splices a spiritmender +
 * re-run of the role; a `failed-replan` (plan hole) splices a PathSeeker replan; only PathSeeker's
 * exhausted replan loop blocks the quest.
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
 * parses every scenario through `smoketestScenarioContract` so drift surfaces immediately. The exact
 * intermediate work-item counts on the failure scenarios depend on the recovery chain and are
 * confirmed by a live `/smoketest` run; the assertions here pin only the invariants (terminal status
 * and the presence of the spliced fixer role).
 */

import { smoketestBlueprintsStatics } from '../smoketest-blueprints/smoketest-blueprints-statics';

const happyScripts = {
  codeweaver: ['signalComplete'],
  siegemaster: ['signalComplete'],
  lawbringer: ['signalComplete'],
  blightwarden: ['signalComplete'],
  spiritmender: ['signalComplete'],
  pathseeker: ['signalComplete'],
};

// Codeweaver signals a CODE failure (with retry budget) → the handler splices a spiritmender + a
// ward(changed) gate + a fresh codeweaver. The spiritmender fixes the code, the fresh codeweaver
// completes, and the quest finishes. No PathSeeker replan on a first code failure with budget.
const codeweaverFailRecoveryScripts = {
  codeweaver: ['signalFailed', 'signalComplete'],
  spiritmender: ['signalComplete'],
  siegemaster: ['signalComplete'],
  lawbringer: ['signalComplete'],
  blightwarden: ['signalComplete'],
};

const lawbringerFailSpiritmenderScripts = {
  codeweaver: ['signalComplete'],
  siegemaster: ['signalComplete'],
  lawbringer: ['signalFailed'],
  spiritmender: ['signalComplete'],
  pathseeker: ['signalComplete'],
  blightwarden: ['signalComplete'],
};

// The SOLE block path: a codeweaver that fails every attempt exhausts its retry budget, escalates to
// a PathSeeker replan, the replan regenerates the chain, the new codeweaver fails again … until the
// PathSeeker replan loop (`slotManagerStatics.pathseeker.replanMaxCycles`) is spent and the quest
// blocks. The scripts over-provision `signalFailed`/`signalComplete` entries so every dispatch in the
// (recovery-chain-dependent) unfold has a canned prompt; excess entries are ignored by the driver.
const replanExhaustionScripts = {
  codeweaver: [
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
  ],
  spiritmender: [
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
  ],
  pathseeker: [
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
    'signalComplete',
  ],
};

const blightwardenReplanScripts = {
  codeweaver: ['signalComplete'],
  siegemaster: ['signalComplete'],
  lawbringer: ['signalComplete'],
  blightwarden: ['signalFailedReplan'],
  pathseeker: ['signalComplete', 'signalComplete'],
};

export const smoketestScenariosStatics = {
  orchHappyPath: {
    caseId: 'orch-happy-path',
    name: 'Orchestration: happy path',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: happyScripts,
    assertions: [{ kind: 'quest-status', expected: 'complete' }],
  },
  orchCodeweaverFail: {
    caseId: 'orch-codeweaver-fail',
    name: 'Orchestration: codeweaver fail then spiritmender recovery',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: codeweaverFailRecoveryScripts,
    assertions: [
      { kind: 'quest-status', expected: 'complete' },
      { kind: 'work-item-role-count', role: 'spiritmender', minCount: 1 },
    ],
  },
  orchLawbringerFail: {
    caseId: 'orch-lawbringer-fail',
    name: 'Orchestration: lawbringer fail then spiritmender fix',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: lawbringerFailSpiritmenderScripts,
    assertions: [
      { kind: 'quest-status', expected: 'complete' },
      { kind: 'work-item-role-count', role: 'spiritmender', minCount: 1 },
    ],
  },
  orchDepthExhaustion: {
    caseId: 'orch-depth-exhaustion',
    name: 'Orchestration: codeweaver replan-loop exhaustion then blocked',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: replanExhaustionScripts,
    assertions: [{ kind: 'quest-status', expected: 'blocked' }],
  },
  orchBlightwardenReplan: {
    caseId: 'orch-blightwarden-replan',
    name: 'Orchestration: blightwarden failed-replan',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: blightwardenReplanScripts,
    assertions: [{ kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 }],
  },
};
