/**
 * PURPOSE: Proxy for questRecoverSiegeBroker — composes the dependency proxies and exposes semantic
 *   setup methods plus inspectors for the spliced work items and the finding sidecar it wrote.
 *
 * USAGE:
 * const proxy = questRecoverSiegeBrokerProxy();
 * proxy.setupRecover({ quest });
 * await questRecoverSiegeBroker({ questId, failedWorkItemId, finding });
 * expect(proxy.getFinalPersistedQuestStatus()).toBe('in_progress');
 */

import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  fileContentsContract,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
  type FileContents,
  type Quest,
  type QuestStub,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questSpliceFixerBrokerProxy } from '../splice-fixer/quest-splice-fixer-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

const BATCHES_DIR_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches' });
const BATCH_FILE_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches/batch.json' });

export const questRecoverSiegeBrokerProxy = (): {
  setupRecover: (params: { quest: QuestInput }) => void;
  setupExhausted: (params: { quest: QuestInput }) => void;
  getFinalPersistedWorkItems: () => readonly WorkItem[];
  getFinalPersistedQuestStatus: () => Quest['status'] | undefined;
  getWrittenSidecarContents: () => FileContents | undefined;
} => {
  // Real crypto.randomUUID gives distinct valid ids for the spliced spiritmender / ward / siege —
  // the tests read dependency wiring back by role + insertedBy, not by pinned id, so no uuid spy is
  // needed (and a global spy would clash when this proxy is composed into the signal-back responder
  // proxy alongside the post-walk hook's own uuid mock).
  fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const extraPathJoin = pathJoinAdapterProxy();
  const findProxy = questFindQuestPathBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const blockProxy = questBlockOnFailureBrokerProxy();
  const spliceProxy = questSpliceFixerBrokerProxy();

  const setupFindQuestPathForBroker = ({ quest }: { quest: QuestInput }): void => {
    const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
    const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
    const questsDirPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
    });
    const questFolderPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
    });
    const questFilePath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
    });

    findProxy.setupQuestFound({
      homeDir: '/home/testuser',
      homePath,
      guildsDir,
      guilds: [
        {
          dirName: FileNameStub({ value: guildId }),
          questsDirPath,
          questFolders: [
            {
              folderName: FileNameStub({ value: quest.folder }),
              questFilePath,
              questFolderPath,
              contents: FileContentsStub({ value: JSON.stringify(quest) }),
            },
          ],
        },
      ],
    });
  };

  return {
    setupRecover: ({ quest }: { quest: QuestInput }): void => {
      // 1. questGetBroker (load for budget/idempotency checks)
      getProxy.setupQuestFound({ quest });
      // 2. questFindQuestPathBroker (its own pathJoins resolved by findProxy)
      setupFindQuestPathForBroker({ quest });
      // 3. broker's own two inline pathJoins: batches dir + sidecar file path
      extraPathJoin.returns({ result: BATCHES_DIR_PATH });
      extraPathJoin.returns({ result: BATCH_FILE_PATH });
      // 4. questSpliceFixerBroker → questWorkItemInsertBroker → questModifyBroker (real splice)
      spliceProxy.setupQuestModify({ quest });
    },

    setupExhausted: ({ quest }: { quest: QuestInput }): void => {
      // Last attempt — the broker routes to questBlockOnFailureBroker instead of splicing. Run the
      // real block broker (passthrough) so the test asserts the actual blocked + skipped outcome.
      getProxy.setupQuestFound({ quest });
      blockProxy.setupPassthrough();
      blockProxy.setupQuestFound({ quest });
    },

    getFinalPersistedWorkItems: (): readonly WorkItem[] => {
      const spliced = spliceProxy.getPersistedQuests();
      const lastSpliced = spliced[spliced.length - 1];
      if (lastSpliced !== undefined) {
        return lastSpliced.workItems;
      }
      const blockContents = blockProxy.getAllPersistedContents();
      const lastBlock = blockContents[blockContents.length - 1];
      if (typeof lastBlock !== 'string') {
        return [];
      }
      return questContract.parse(JSON.parse(lastBlock)).workItems;
    },

    getFinalPersistedQuestStatus: (): Quest['status'] | undefined => {
      const spliced = spliceProxy.getPersistedQuests();
      const lastSpliced = spliced[spliced.length - 1];
      if (lastSpliced !== undefined) {
        return lastSpliced.status;
      }
      const blockContents = blockProxy.getAllPersistedContents();
      const lastBlock = blockContents[blockContents.length - 1];
      if (typeof lastBlock !== 'string') {
        return undefined;
      }
      return questContract.parse(JSON.parse(lastBlock)).status;
    },

    getWrittenSidecarContents: (): FileContents | undefined => {
      const written = writeFileProxy
        .getAllWrittenFiles()
        .filter(({ path }) => String(path).endsWith('.json'));
      const last = written[written.length - 1];
      if (last === undefined) {
        return undefined;
      }
      return fileContentsContract.parse(String(last.content));
    },
  };
};
