/**
 * PURPOSE: Runs a smoketest suite by clearing prior smoketest quests, hydrating one quest per suite (MCP/Signals bundle into one, Orchestration creates N), registering post-terminal listeners + scenario drivers, and enqueuing each quest on the cross-guild quest execution queue
 *
 * USAGE:
 * const result = await SmoketestRunResponder({ suite, startPath });
 * // Returns: { runId, enqueued: [{ questId, guildSlug }], results: [] }
 * // `enqueued[0]` is the first-enqueued quest — the caller uses it to navigate to the execution view.
 */

import {
  questSourceContract,
  smoketestRunIdContract,
  urlSlugContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  SmoketestCaseResult,
  SmoketestRunId,
  SmoketestSuite,
  UrlSlug,
  QuestId,
} from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import {
  smoketestScenarioContract,
  type SmoketestScenario,
} from '../../../contracts/smoketest-scenario/smoketest-scenario-contract';
import { smoketestCaseCatalogStatics } from '../../../statics/smoketest-case-catalog/smoketest-case-catalog-statics';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { smoketestClearPriorQuestsBroker } from '../../../brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker';
import { smoketestEnsureGuildBroker } from '../../../brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker';
import { smoketestRunState } from '../../../state/smoketest-run/smoketest-run-state';
import { EnqueueBundledSuiteLayerResponder } from './enqueue-bundled-suite-layer-responder';
import { EnqueueOrchestrationScenarioLayerResponder } from './enqueue-orchestration-scenario-layer-responder';

export const SmoketestRunResponder = async ({
  suite,
  startPath: _startPath,
}: {
  suite: SmoketestSuite;
  startPath: FilePath;
}): Promise<{
  runId: SmoketestRunId;
  enqueued: readonly { questId: QuestId; guildSlug: UrlSlug }[];
  results: readonly SmoketestCaseResult[];
}> => {
  const existing = smoketestRunState.getActive();
  if (existing !== null) {
    throw new Error(`Smoketest already running (runId=${existing.runId}, suite=${existing.suite})`);
  }

  const runId = smoketestRunIdContract.parse(crypto.randomUUID());
  smoketestRunState.start({ runId, suite });

  try {
    const { guildId } = await smoketestEnsureGuildBroker();
    const guild = await guildGetBroker({ guildId });
    const guildSlug = urlSlugContract.parse(
      guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name }),
    );

    const enqueued: { questId: QuestId; guildSlug: UrlSlug }[] = [];

    if (suite === 'mcp' || suite === 'all') {
      const questSource = questSourceContract.parse('smoketest-mcp');
      await smoketestClearPriorQuestsBroker({ questSource });
      const bundled = await EnqueueBundledSuiteLayerResponder({
        suite: 'mcp',
        questSource,
        guildId,
        guildSlug,
      });
      if (bundled !== null) {
        enqueued.push(bundled);
      }
    }

    if (suite === 'signals' || suite === 'all') {
      const questSource = questSourceContract.parse('smoketest-signals');
      await smoketestClearPriorQuestsBroker({ questSource });
      const bundled = await EnqueueBundledSuiteLayerResponder({
        suite: 'signals',
        questSource,
        guildId,
        guildSlug,
      });
      if (bundled !== null) {
        enqueued.push(bundled);
      }
    }

    if (suite === 'orchestration' || suite === 'all') {
      const questSource = questSourceContract.parse('smoketest-orchestration');
      await smoketestClearPriorQuestsBroker({ questSource });

      const orchRecords = await smoketestCaseCatalogStatics.orchestration.reduce<
        Promise<readonly { questId: QuestId; guildSlug: UrlSlug }[]>
      >(
        async (prevPromise, scenarioRaw) => {
          const prev = await prevPromise;
          const scenario: SmoketestScenario = smoketestScenarioContract.parse(scenarioRaw);
          const record = await EnqueueOrchestrationScenarioLayerResponder({
            scenario,
            questSource,
            guildId,
            guildSlug,
          });
          return [...prev, record];
        },
        Promise.resolve([] as readonly { questId: QuestId; guildSlug: UrlSlug }[]),
      );

      enqueued.push(...orchRecords);
    }

    return { runId, enqueued, results: [] as readonly SmoketestCaseResult[] };
  } finally {
    smoketestRunState.end();
  }
};
