/**
 * PURPOSE: Layer helper for SmoketestRunResponder — hydrates one quest for the MCP or Signals suite via caseCatalogToBlueprintTransformer, overwrites its workItems under lock, enqueues, and registers post-terminal listener + scenario-meta entries
 *
 * USAGE:
 * const record = await EnqueueBundledSuiteLayerResponder({ suite: 'mcp', questSource, guildId, guildSlug });
 * // Returns { questId, guildSlug } or null when the catalog is empty.
 */

import type {
  GuildId,
  QuestQueueEntry,
  QuestSource,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { smoketestListenerEntryContract } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import { smoketestScenarioMetaContract } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { questHydrateBroker } from '../../../brokers/quest/hydrate/quest-hydrate-broker';
import { smoketestCaseCatalogStatics } from '../../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { caseCatalogToBlueprintTransformer } from '../../../transformers/case-catalog-to-blueprint/case-catalog-to-blueprint-transformer';
import { smoketestSubstituteWorkItemPlaceholdersTransformer } from '../../../transformers/smoketest-substitute-work-item-placeholders/smoketest-substitute-work-item-placeholders-transformer';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { LoadQuestLayerResponder } from './load-quest-layer-responder';
import { OverwriteWorkItemsLayerResponder } from './overwrite-work-items-layer-responder';

export const EnqueueBundledSuiteLayerResponder = async ({
  suite,
  questSource,
  guildId,
  guildSlug,
}: {
  suite: 'mcp' | 'signals';
  questSource: QuestSource;
  guildId: GuildId;
  guildSlug: UrlSlug;
}): Promise<{ questId: QuestId; guildSlug: UrlSlug } | null> => {
  const cases =
    suite === 'mcp' ? smoketestCaseCatalogStatics.mcp : smoketestCaseCatalogStatics.signals;

  if (cases.length === 0) {
    return null;
  }

  const now = isoTimestampContract.parse(new Date().toISOString());
  const { blueprint, workItems } = caseCatalogToBlueprintTransformer({
    suite,
    cases,
    now,
  });

  const { questId } = await questHydrateBroker({ blueprint, guildId, questSource });

  const substitutedWorkItems = smoketestSubstituteWorkItemPlaceholdersTransformer({
    workItems,
    questId,
    guildId,
  });

  await OverwriteWorkItemsLayerResponder({ questId, workItems: substitutedWorkItems });

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
      assertions: [],
      isOrchestration: false,
    }),
  });

  smoketestScenarioMetaState.register({
    questId,
    meta: smoketestScenarioMetaContract.parse({
      caseId: `smoketest-suite-${suite}`,
      name: suite === 'mcp' ? 'Smoketest: MCP' : 'Smoketest: Signals',
      startedAt: Date.now(),
    }),
  });

  return { questId, guildSlug };
};
