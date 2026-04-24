/**
 * PURPOSE: Layer helper for SmoketestRunResponder — hydrates one orchestration-scenario quest, starts its scenario driver (poll-based, runs regardless of queue position), enqueues it, and registers post-terminal listener + scenario-meta entries
 *
 * USAGE:
 * const record = await EnqueueOrchestrationScenarioLayerResponder({ scenario, questSource, guildId, guildSlug });
 * // Returns { questId, guildSlug }.
 */

import type {
  GuildId,
  ProcessId,
  QuestId,
  QuestQueueEntry,
  QuestSource,
  UrlSlug,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';

import { smoketestListenerEntryContract } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import type { SmoketestScenario } from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import { smoketestScenarioMetaContract } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { questHydrateBroker } from '../../../brokers/quest/hydrate/quest-hydrate-broker';
import { smoketestScenarioDriverBroker } from '../../../brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { smoketestScenarioState } from '../../../state/smoketest-scenario/smoketest-scenario-state';
import { LoadQuestLayerResponder } from './load-quest-layer-responder';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const EnqueueOrchestrationScenarioLayerResponder = async ({
  scenario,
  questSource,
  guildId,
  guildSlug,
}: {
  scenario: SmoketestScenario;
  questSource: QuestSource;
  guildId: GuildId;
  guildSlug: UrlSlug;
}): Promise<{ questId: QuestId; guildSlug: UrlSlug }> => {
  const { blueprint } = scenario;
  const { questId } = await questHydrateBroker({ blueprint, guildId, questSource });

  smoketestScenarioState.register({ questId, scripts: scenario.scripts });

  const driver = await smoketestScenarioDriverBroker({
    questId,
    dispense: ({ role }: { role: WorkItemRole }): SmoketestPromptName | null =>
      smoketestScenarioState.dispense({ questId, role }),
    subscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.on({ type: 'quest-modified', handler });
    },
    unsubscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.off({ type: 'quest-modified', handler });
    },
  });

  const quest = await LoadQuestLayerResponder({ questId });
  const entry: QuestQueueEntry = questQueueEntryContract.parse({
    questId,
    guildId,
    guildSlug,
    questTitle: quest.title,
    status: quest.status,
    questSource,
    enqueuedAt: new Date().toISOString(),
  });
  questExecutionQueueState.enqueue({ entry });

  smoketestListenerState.register({
    questId,
    entry: smoketestListenerEntryContract.parse({
      assertions: scenario.assertions,
      ...(scenario.postTeardownChecks === undefined
        ? {}
        : { postTeardownChecks: scenario.postTeardownChecks }),
      stopDriver: driver.stop,
      isOrchestration: true,
    }),
  });

  smoketestScenarioMetaState.register({
    questId,
    meta: smoketestScenarioMetaContract.parse({
      caseId: scenario.caseId,
      name: scenario.name,
      startedAt: Date.now(),
    }),
  });

  return { questId, guildSlug };
};
