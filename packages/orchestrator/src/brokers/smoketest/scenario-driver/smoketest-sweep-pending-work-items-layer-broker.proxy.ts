import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { smoketestSignOutstandingUnitsBrokerProxy } from '../sign-outstanding-units/smoketest-sign-outstanding-units-broker.proxy';
import { smoketestStampOverrideBrokerProxy } from '../stamp-override/smoketest-stamp-override-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type PromptText = ReturnType<typeof PromptTextStub>;

export const smoketestSweepPendingWorkItemsLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
  // The persisted bytes parsed back into overrides, so a test can assert the RESOLVED prompt text
  // without importing the quest contract itself.
  getStampedOverrides: () => readonly (PromptText | undefined)[];
  // Every quest the sweep's own writes produced, parsed. Both the sign-off write and the stamp go
  // through questPersistBroker, so this is the one place a test reads either back.
  getPersistedQuests: () => readonly Quest[];
} => {
  // Register child proxies for every implementation import even though the stampProxy already
  // registers its own nested chain — the enforce-proxy-child-creation rule requires each direct
  // implementation import to have a matching proxy import at this layer.
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  pathJoinAdapterProxy();
  const signProxy = smoketestSignOutstandingUnitsBrokerProxy();
  const stampProxy = smoketestStampOverrideBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      // Three quest LOADS happen per stamped work item: the sweep's own, the sign broker's, and the
      // stamp broker's. questLoadBrokerProxy queues one read per call, so all three need seeding —
      // an unconsumed queue entry is inert, a missing one throws.
      stampProxy.setupQuestFound({ quest });
      stampProxy.setupQuestFound({ quest });
      stampProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      stampProxy.setupQuestNotFound();
    },
    getAllPersistedContents: (): readonly unknown[] => stampProxy.getAllPersistedContents(),
    getStampedOverrides: (): readonly (PromptText | undefined)[] =>
      stampProxy
        .getAllPersistedContents()
        .map((content) => questContract.parse(JSON.parse(String(content))))
        .flatMap((persisted) => persisted.workItems.map((wi) => wi.smoketestPromptOverride)),
    getPersistedQuests: (): readonly Quest[] => signProxy.getPersistedQuests(),
  };
};
