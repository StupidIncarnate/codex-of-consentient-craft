/**
 * PURPOSE: Layer broker for smoketestPostTerminalListenerBroker — loads a just-terminalized smoketest quest, runs assertions + teardown, persists the case result onto quest.smoketestResults, stops the scenario driver, and unregisters the listener
 *
 * USAGE:
 * const result = await processTerminalEventLayerBroker({ questId, entry, scenarioMeta, unregisterListener });
 * // Writes smoketestResults onto the quest file atomically under the per-questId lock; idempotent (no-op when status is not terminal).
 *
 * WHEN-TO-USE: Only from smoketestPostTerminalListenerBroker's event handler.
 * WHEN-NOT-TO-USE: Anywhere outside the smoketest flow.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  questContract,
  smoketestCaseResultContract,
} from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  Quest,
  QuestId,
  SmoketestCaseResult,
} from '@dungeonmaster/shared/contracts';
import { isTerminalQuestStatusGuard } from '@dungeonmaster/shared/guards';

import type { SmoketestListenerEntry } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import type { SmoketestScenarioMeta } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { isQuestNotFoundErrorGuard } from '../../../guards/is-quest-not-found-error/is-quest-not-found-error-guard';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../quest/with-modify-lock/quest-with-modify-lock-broker';
import { smoketestAssertFinalStateBroker } from '../assert-final-state/smoketest-assert-final-state-broker';
import { smoketestRunTeardownChecksBroker } from '../run-teardown-checks/smoketest-run-teardown-checks-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const processTerminalEventLayerBroker = async ({
  questId,
  entry,
  scenarioMeta,
  unregisterListener,
}: {
  questId: QuestId;
  entry: SmoketestListenerEntry;
  scenarioMeta: SmoketestScenarioMeta;
  unregisterListener: ({ questId }: { questId: QuestId }) => void;
}): Promise<AdapterResult> => {
  const notProcessed = adapterResultContract.parse({ success: true });

  // The quest may have been deleted between the outbox event being appended and this
  // handler running (e.g. the user abandoned + deleted a stuck smoketest quest, or the
  // next suite run cleared prior quests). In that case `questFindQuestPathBroker` throws
  // — there's nothing to assert against, so stop the scenario driver and unregister the
  // listener so the caller's unregister callback fires and the active-run flag can clear.
  const foundPath: { questPath: AbsoluteFilePath } | null = await questFindQuestPathBroker({
    questId,
  }).catch((error: unknown): null => {
    if (isQuestNotFoundErrorGuard({ error })) {
      return null;
    }
    throw error;
  });

  if (foundPath === null) {
    if (entry.stopDriver !== undefined) {
      entry.stopDriver();
    }
    unregisterListener({ questId });
    return notProcessed;
  }

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [foundPath.questPath, QUEST_FILE_NAME] }),
  );

  const quest: Quest = await questLoadBroker({ questFilePath });

  if (!isTerminalQuestStatusGuard({ status: quest.status })) {
    return notProcessed;
  }

  const assertionOutcome = smoketestAssertFinalStateBroker({
    quest,
    assertions: entry.assertions,
  });

  const teardownOutcome = await (entry.postTeardownChecks === undefined
    ? Promise.resolve({ passed: true, failures: [] as readonly [] })
    : smoketestRunTeardownChecksBroker({ checks: entry.postTeardownChecks }));

  const nowEpoch = Date.now();
  const rawDuration = nowEpoch - Number(scenarioMeta.startedAt);
  const durationMs = rawDuration < 0 ? 0 : rawDuration;
  const passed = assertionOutcome.failures.length === 0 && teardownOutcome.failures.length === 0;

  const caseResult: SmoketestCaseResult = smoketestCaseResultContract.parse({
    caseId: scenarioMeta.caseId,
    name: scenarioMeta.name,
    passed,
    durationMs,
  });

  await questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ success: true }> => {
      const loaded = await questLoadBroker({ questFilePath });
      const existingResults = loaded.smoketestResults ?? [];
      const updatedQuest = questContract.parse({
        ...loaded,
        smoketestResults: [...existingResults, caseResult],
        updatedAt: new Date().toISOString(),
      });
      const json = fileContentsContract.parse(
        JSON.stringify(updatedQuest, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: json, questId });
      return { success: true as const };
    },
  });

  if (entry.stopDriver !== undefined) {
    entry.stopDriver();
  }

  unregisterListener({ questId });

  return adapterResultContract.parse({ success: true });
};
