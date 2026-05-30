import { questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questSpliceFixerBrokerProxy = (): {
  setupQuestModify: (params: { quest: Quest }) => void;
  getPersistedQuests: () => Quest[];
} => {
  // questWorkItemInsertBroker (called by the splice fixer) delegates to the REAL
  // questModifyBroker via its proxy's module-level passthrough; questPersistBroker is the
  // only mocked I/O boundary, so the persisted quest.json content reflects the true outcome
  // (appended items + rewired dependsOn). getPersistedQuests() parses each persisted JSON
  // string back through questContract so tests receive branded Quest objects (test files
  // cannot import contracts).
  const insertProxy = questWorkItemInsertBrokerProxy();

  return {
    setupQuestModify: ({ quest }: { quest: Quest }): void => {
      insertProxy.setupQuestModify({ quest });
    },
    getPersistedQuests: (): Quest[] =>
      insertProxy
        .getPersistedQuests()
        .map((contents) => questContract.parse(JSON.parse(String(contents)))),
  };
};
