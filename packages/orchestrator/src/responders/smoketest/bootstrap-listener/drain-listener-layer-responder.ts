/**
 * PURPOSE: Layer responder for SmoketestBootstrapListenerResponder — runs on every post-terminal listener unregister to drain the per-quest listener + scenario-meta registries and clear the active-run flag when the LAST quest drains (re-enabling subsequent POST /api/tooling/smoketest/run calls)
 *
 * USAGE:
 * DrainListenerLayerResponder({ questId });
 * // Unregisters listener + scenario meta; if the registry is now empty, calls smoketestRunState.end().
 *
 * WHEN-TO-USE: Only from SmoketestBootstrapListenerResponder as the wired unregister callback.
 * WHEN-NOT-TO-USE: Anywhere else. Not a general-purpose drain — it's the concrete tie between the listener lifecycle and the active-run flag.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';

export const DrainListenerLayerResponder = ({ questId }: { questId: QuestId }): void => {
  smoketestListenerState.unregister({ questId });
  smoketestScenarioMetaState.unregister({ questId });
  if (smoketestListenerState.getAllQuestIds().length === 0) {
    smoketestRunState.end();
  }
};
