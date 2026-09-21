/**
 * PURPOSE: Proxy for lane-record-instance-broker — stages the quest LOAD and PERSIST fs boundary
 * only. `questPath` is a plain parameter now (never resolved via questFindQuestPathBroker inside
 * this broker), so this proxy has none of that resolution's fs mocking to compose.
 *
 * USAGE:
 * const proxy = laneRecordInstanceBrokerProxy();
 * proxy.setupQuestFound({ quest, questPath });
 * // ...call laneRecordInstanceBroker...
 * const persisted = proxy.getLastPersistedQuest();
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, questContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../../quest/persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const laneRecordInstanceBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest; questPath: AbsoluteFilePath }) => void;
  getLastPersistedQuest: () => Parsed;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  return {
    setupQuestFound: ({
      quest,
      questPath,
    }: {
      quest: Quest;
      questPath: AbsoluteFilePath;
    }): void => {
      const questFilePath = FilePathStub({ value: `${String(questPath)}/quest.json` });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });

      pathJoinProxy.returns({ result: questFilePath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    getLastPersistedQuest: (): Parsed => {
      const persisted = persistProxy
        .getAllWrittenFiles()
        .filter(({ path }) => {
          const pathStr = String(path);
          return pathStr.endsWith('quest.json') || pathStr.endsWith('quest.json.tmp');
        })
        .map(({ content }) => content);
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(
        JSON.parse(typeof lastWrite === 'string' ? lastWrite : String(lastWrite)),
      );
    },
  };
};
