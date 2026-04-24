/**
 * PURPOSE: Multi-active per-quest scenario state keyed by QuestId — holds per-role script of canned prompt names plus per-role call ordinals; dispense returns and advances one prompt at a time for the given quest
 *
 * USAGE:
 * smoketestScenarioState.register({ questId, scripts: { codeweaver: ['signalFailed', 'signalComplete'] } });
 * smoketestScenarioState.dispense({ questId, role: 'codeweaver' });
 * // Returns: 'signalFailed' (first call), then 'signalComplete' (second), then null (exhausted)
 * smoketestScenarioState.getActive({ questId });
 * smoketestScenarioState.unregister({ questId });
 *
 * WHEN-TO-USE: Orchestration smoketest enqueues multiple scenarios at once; each registered quest gets
 * its own isolated script + ordinal bookkeeping. Re-registering an already-active questId throws so
 * double-registration bugs surface immediately.
 */

import {
  arrayIndexContract,
  type QuestId,
  type WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import type { ScenarioInstance } from '../../contracts/scenario-instance/scenario-instance-contract';
import type { SmoketestPromptName } from '../../statics/smoketest-prompts/smoketest-prompts-statics';

const state: { instances: Map<QuestId, ScenarioInstance> } = {
  instances: new Map(),
};

export const smoketestScenarioState = {
  register: ({
    questId,
    scripts,
  }: {
    questId: QuestId;
    scripts: ScenarioInstance['scripts'];
  }): void => {
    if (state.instances.has(questId)) {
      throw new Error(`smoketestScenarioState.register: quest "${questId}" is already registered`);
    }
    state.instances.set(questId, { scripts, callOrdinals: {} });
  },

  dispense: ({
    questId,
    role,
  }: {
    questId: QuestId;
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
    const ordinal = instance.callOrdinals[role] ?? arrayIndexContract.parse(0);
    if (ordinal >= script.length) {
      return null;
    }
    const promptName = script[ordinal] ?? null;
    instance.callOrdinals[role] = arrayIndexContract.parse(ordinal + 1);
    return promptName;
  },

  unregister: ({ questId }: { questId: QuestId }): void => {
    state.instances.delete(questId);
  },

  getActive: ({ questId }: { questId: QuestId }): ScenarioInstance | null =>
    state.instances.get(questId) ?? null,
};
