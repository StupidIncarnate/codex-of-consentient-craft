/**
 * PURPOSE: Proxy for RecoverLawbringerLayerResponder. Composes the real find-quest-path / get /
 *   splice proxies (no module mocks, so importing this proxy into the parent responder proxy is
 *   side-effect-free) plus the real fs write/mkdir + pathJoin adapter proxies so the test can
 *   inspect the written sidecar and the spliced work items.
 *
 * USAGE:
 * const proxy = RecoverLawbringerLayerResponderProxy();
 * proxy.setupQuestFound({ quest });
 * // ...call responder...
 * const written = proxy.getWrittenSidecar();
 * const inserted = proxy.getInsertedWorkItems();
 */

import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
  type QuestStub,
} from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questSpliceFixerBrokerProxy } from '../../../brokers/quest/splice-fixer/quest-splice-fixer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

const BATCHES_DIR_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches' });
const BATCH_FILE_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches/batch.json' });

const setupFindQuestPathForDirectCall = ({
  quest,
  findProxy,
}: {
  quest: Quest;
  findProxy: ReturnType<typeof questFindQuestPathBrokerProxy>;
}): void => {
  const guildId = GuildIdStub();
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

export const RecoverLawbringerLayerResponderProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getWrittenSidecar: () => { path: unknown; content: unknown } | undefined;
  getLastPersistedQuest: () => Parsed;
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const getProxy = questGetBrokerProxy();
  // Drives the real splice → insert → modify so the responder completes; its setupQuestModify
  // wires the quest persistence the splice triggers.
  const spliceProxy = questSpliceFixerBrokerProxy();

  const writeProxy = fsWriteFileAdapterProxy();
  fsMkdirAdapterProxy();
  // Layer responder's own joins: batchesDir + batch file. find/get use their own pathJoin proxies.
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      // 1. direct findQuestPath call (sidecar dir resolution)
      setupFindQuestPathForDirectCall({ quest, findProxy });
      // 2. layer's own pathJoin: batchesDir, then batch file
      pathJoinProxy.returns({ result: BATCHES_DIR_PATH });
      pathJoinProxy.returns({ result: BATCH_FILE_PATH });
      // 3. questGetBroker (re-fetch before splice)
      getProxy.setupQuestFound({ quest });
      // 4. splice → insert → modify persists the updated quest
      spliceProxy.setupQuestModify({ quest });
    },

    getWrittenSidecar: (): { path: unknown; content: unknown } | undefined => {
      const files = writeProxy.getAllWrittenFiles();
      // The sidecar is the write whose path targets spiritmender-batches; later quest-modify
      // persistence writes the quest.json through the same adapter.
      return files.find((file) => String(file.path) === String(BATCH_FILE_PATH));
    },

    getLastPersistedQuest: (): Parsed => {
      // The splice → questModifyBroker → questPersistBroker persists the updated quest through
      // the SAME fsWriteFileAdapter the sidecar write uses. quest.json writes go to
      // `<...>/quest.json.tmp` (atomic temp+rename); grab the last such write and parse it.
      const files = writeProxy.getAllWrittenFiles();
      const questWrites = files.filter((file) => {
        const pathStr = String(file.path);
        return pathStr.endsWith('quest.json') || pathStr.endsWith('quest.json.tmp');
      });
      const lastWrite = questWrites[questWrites.length - 1];
      if (lastWrite === undefined) {
        throw new Error('No quest.json persistence write captured by the recover proxy');
      }
      const raw = lastWrite.content;
      return questContract.parse(JSON.parse(typeof raw === 'string' ? raw : String(raw)));
    },
  };
};
