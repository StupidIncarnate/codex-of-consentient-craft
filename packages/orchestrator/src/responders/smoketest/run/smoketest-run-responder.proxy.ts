import type { GuildIdStub, QuestIdStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';
import { GuildStub } from '@dungeonmaster/shared/contracts';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { smoketestClearPriorQuestsBrokerProxy } from '../../../brokers/smoketest/clear-prior-quests/smoketest-clear-prior-quests-broker.proxy';
import { smoketestEnsureGuildBrokerProxy } from '../../../brokers/smoketest/ensure-guild/smoketest-ensure-guild-broker.proxy';
import { smoketestRunStateProxy } from '../../../state/smoketest-run/smoketest-run-state.proxy';
import { EnqueueBundledSuiteLayerResponderProxy } from './enqueue-bundled-suite-layer-responder.proxy';
import { EnqueueOrchestrationScenarioLayerResponderProxy } from './enqueue-orchestration-scenario-layer-responder.proxy';

type GuildId = ReturnType<typeof GuildIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type UrlSlug = ReturnType<typeof UrlSlugStub>;

export const SmoketestRunResponderProxy = (): {
  reset: () => void;
  setupHappyPath: (params: {
    guildId: GuildId;
    guildSlug: UrlSlug;
    bundledRecord?: { questId: QuestId; guildSlug: UrlSlug } | null;
    bundledRecords?: readonly ({ questId: QuestId; guildSlug: UrlSlug } | null)[];
    orchestrationRecords?: readonly { questId: QuestId; guildSlug: UrlSlug }[];
  }) => void;
  setupOrchestrationLayerRejectsOnce: (params: { error: Error }) => void;
  getClearPriorCallArgs: () => readonly unknown[][];
  getEnqueueBundledCallArgs: () => readonly unknown[][];
  getEnqueueOrchestrationCallArgs: () => readonly unknown[][];
} => {
  const guildGetProxy = guildGetBrokerProxy();
  const clearProxy = smoketestClearPriorQuestsBrokerProxy();
  const ensureProxy = smoketestEnsureGuildBrokerProxy();
  smoketestRunStateProxy();
  const bundledProxy = EnqueueBundledSuiteLayerResponderProxy();
  const orchProxy = EnqueueOrchestrationScenarioLayerResponderProxy();

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupHappyPath: ({
      guildId,
      guildSlug,
      bundledRecord,
      bundledRecords,
      orchestrationRecords,
    }: {
      guildId: GuildId;
      guildSlug: UrlSlug;
      bundledRecord?: { questId: QuestId; guildSlug: UrlSlug } | null;
      bundledRecords?: readonly ({ questId: QuestId; guildSlug: UrlSlug } | null)[];
      orchestrationRecords?: readonly { questId: QuestId; guildSlug: UrlSlug }[];
    }): void => {
      ensureProxy.setupReturnsGuildId({ guildId });
      // guildGetBroker is consulted twice (once via responder, once via ensure path indirectly
      // for slug). Use setupConfig to seed a guild config so guildGetBroker resolves cleanly.
      const guild = GuildStub({ id: guildId, urlSlug: guildSlug });
      guildGetProxy.setupConfig({ config: { guilds: [guild] } });

      // Default: every clear call resolves with deletedCount=0.
      clearProxy.setupSucceeds();
      clearProxy.setupSucceeds();
      clearProxy.setupSucceeds();

      const computeBundledList = (): readonly ({
        questId: QuestId;
        guildSlug: UrlSlug;
      } | null)[] => {
        if (bundledRecords !== undefined) {
          return bundledRecords;
        }
        if (bundledRecord === undefined) {
          return [];
        }
        return [bundledRecord];
      };
      const bundledList = computeBundledList();
      for (const record of bundledList) {
        if (record === null) {
          bundledProxy.setupReturnsNull();
        } else {
          bundledProxy.setupReturnsRecord({ record });
        }
      }

      const orchList: readonly { questId: QuestId; guildSlug: UrlSlug }[] =
        orchestrationRecords ?? [];
      for (const record of orchList) {
        orchProxy.setupReturnsRecord({ record });
      }
    },
    setupOrchestrationLayerRejectsOnce: ({ error }: { error: Error }): void => {
      orchProxy.setupRejectsOnce({ error });
    },
    getClearPriorCallArgs: (): readonly unknown[][] => clearProxy.getCallArgs(),
    getEnqueueBundledCallArgs: (): readonly unknown[][] => bundledProxy.getCallArgs(),
    getEnqueueOrchestrationCallArgs: (): readonly unknown[][] => orchProxy.getCallArgs(),
  };
};
