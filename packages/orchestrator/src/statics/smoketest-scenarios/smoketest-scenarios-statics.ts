/**
 * PURPOSE: Catalog of the five orchestration smoketest scenarios (happy path, codeweaver-fail replan, lawbringer-fail spiritmender, depth exhaustion, blightwarden failed-replan) — each couples the minimal blueprint with per-role prompt scripts and final-state assertions
 *
 * USAGE:
 * smoketestScenariosStatics.orchHappyPath;
 * // Returns the SmoketestScenario literal for the happy-path case (validated against the contract via the colocated test)
 *
 * WHEN-TO-USE: Consumed by smoketestRunOrchestrationCaseBroker (Phase 5) to drive each scenario end-to-end through the real orchestration loop.
 * WHEN-NOT-TO-USE: MCP / Signals suites that do not exercise the work-item loop.
 *
 * NOTE: Scenario values are literal — statics/ cannot import the zod contract. The colocated test parses every scenario through `smoketestScenarioContract` so drift surfaces immediately.
 *
 * Depth-exhaustion notes (case `orch-depth-exhaustion`):
 *   - slotManagerStatics.codeweaver.maxFollowupDepth = 5
 *   - Initial codeweaver dispatch runs at depth 0. Each codeweaver-fail → pathseeker replan →
 *     codeweaver-retry cycle increments `followupDepth` by 1 on the new codeweaver agent.
 *   - The spawn_role branch in orchestration-loop-layer-broker (~line 258) refuses to spawn when
 *     `completedAgent.followupDepth >= maxFollowupDepth`, so the maximum number of codeweaver
 *     dispatches is `maxFollowupDepth + 1` (= 6). The script therefore ships 6 `signalFailed`
 *     entries; excess entries are safely ignored by scenario-driver dispense.
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

const codeweaverFailReplanScripts = {
  codeweaver: ['signalFailed', 'signalComplete'],
  pathseeker: ['signalComplete', 'signalComplete'],
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

const depthExhaustionScripts = {
  codeweaver: [
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
    'signalFailed',
  ],
  pathseeker: [
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
    name: 'Orchestration: codeweaver fail then pathseeker replan',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: codeweaverFailReplanScripts,
    assertions: [
      { kind: 'quest-status', expected: 'complete' },
      { kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 },
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
    name: 'Orchestration: depth exhaustion',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: depthExhaustionScripts,
    assertions: [
      { kind: 'quest-status', expected: 'blocked' },
      { kind: 'work-item-role-count', role: 'codeweaver', minCount: 6 },
    ],
  },
  orchBlightwardenReplan: {
    caseId: 'orch-blightwarden-replan',
    name: 'Orchestration: blightwarden failed-replan',
    blueprint: smoketestBlueprintsStatics.minimal,
    scripts: blightwardenReplanScripts,
    assertions: [{ kind: 'work-item-role-count', role: 'pathseeker', minCount: 2 }],
  },
};
