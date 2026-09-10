/**
 * PURPOSE: Proxy for QuestRecordSessionResponder — delegates to the session-record broker's proxy,
 * so the append runs through the real lock, load and contract parse with only the fs adapters
 * mocked.
 *
 * USAGE:
 * const proxy = QuestRecordSessionResponderProxy();
 * proxy.setupQuestFound({ quest });
 * // ...call QuestRecordSessionResponder...
 * proxy.getLastPersistedQuest();
 */

import type { questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questSessionRecordBrokerProxy } from '../../../brokers/quest/session-record/quest-session-record-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const QuestRecordSessionResponderProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getLastPersistedQuest: () => Parsed;
} => {
  const brokerProxy = questSessionRecordBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },
    getLastPersistedQuest: (): Parsed => brokerProxy.getLastPersistedQuest(),
  };
};
