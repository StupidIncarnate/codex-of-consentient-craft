/**
 * PURPOSE: Multi-active per-quest scenario state keyed by QuestId — holds per-role script of canned prompt names plus per-role call ordinals; dispense returns and advances one prompt at a time for the given quest
 *
 * USAGE:
 * smoketestScenarioState.register({ questId, scripts: { codeweaver: ['signalComplete', 'signalDone'] } });
 * smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
 * // Returns: 'signalComplete' (first call), then 'signalDone' (second), then null (exhausted)
 * smoketestScenarioState.getActive({ questId });
 * smoketestScenarioState.unregister({ questId });
 *
 * WHEN-TO-USE: Orchestration smoketest enqueues multiple scenarios at once; each registered quest gets
 * its own isolated script + ordinal bookkeeping. Re-registering an already-active questId throws so
 * double-registration bugs surface immediately.
 */

import { smoketestScenarioStateContract } from '../../contracts/smoketest-scenario-state/smoketest-scenario-state-contract';
import type { SmoketestScenarioState } from '../../contracts/smoketest-scenario-state/smoketest-scenario-state-contract';
import { type WorkItemRole } from '@dungeonmaster/shared/contracts';

import { scenarioInstanceContract } from '../../contracts/scenario-instance/scenario-instance-contract';
import type { ScenarioInstance } from '../../contracts/scenario-instance/scenario-instance-contract';
import type { SmoketestPromptName } from '../../statics/smoketest-prompts/smoketest-prompts-statics';
import type { Quest } from '@dungeonmaster/shared/contracts';

const state: SmoketestScenarioState = smoketestScenarioStateContract.parse({
  instances: new Map(),
});

export const smoketestScenarioState = {
  register: ({
    questId,
    scripts,
  }: {
    questId: Quest['id'];
    scripts: ScenarioInstance['scripts'];
  }): void => {
    if (state.instances.has(questId)) {
      throw new Error(`smoketestScenarioState.register: quest "${questId}" is already registered`);
    }
    state.instances.set(questId, scenarioInstanceContract.parse({ scripts, callOrdinals: {} }));
  },

  dispense: ({
    questId,
    role,
  }: {
    questId: Quest['id'];
    role: WorkItemRole;
  }): SmoketestPromptName | null => {
    const instance = state.instances.get(questId);
    if (instance === undefined) {
      return null;
    }
    const script = instance.scripts[role];
    if (script === undefined) {
      return null;
    }
    const ordinal = instance.callOrdinals[role] ?? 0;
    if (ordinal >= script.length) {
      return null;
    }
    const promptName = script[ordinal] ?? null;
    instance.callOrdinals[role] = scenarioInstanceContract.shape.callOrdinals.parse(scenarioInstanceContract.shape.callOrdinals.parse(scenarioInstanceContract.shape.callOrdinals.parse((ordinal + 1))));
    return promptName;
  },

  unregister: ({ questId }: { questId: Quest['id'] }): void => {
    state.instances.delete(questId);
  },

  getActive: ({ questId }: { questId: Quest['id'] }): ScenarioInstance | null =>
    state.instances.get(questId) ?? null,
};
