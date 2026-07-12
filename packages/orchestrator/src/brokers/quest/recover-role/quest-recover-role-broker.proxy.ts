/**
 * PURPOSE: Proxy for questRecoverRoleBroker — two roles:
 *   1) Downstream callers (signal-back handler) stub the broker via setupRecovered / setupEscalated.
 *   2) The broker's own test runs the real implementation (setupRecover / setupExhausted*) and composes
 *      the fs, find-quest-path, splice-fixer, and splice-pathseeker-replan proxies so the full flow
 *      exercises real code. Inspectors expose the spliced work items and the finding sidecar.
 *
 * USAGE (caller test):
 * const proxy = questRecoverRoleBrokerProxy();
 * proxy.setupRecovered();
 * // ...call the responder...
 * expect(proxy.getCalls()).toStrictEqual([[{ questId, failedWorkItemId, finding }]]);
 *
 * USAGE (broker test):
 * const proxy = questRecoverRoleBrokerProxy();
 * proxy.setupRecover({ quest });
 * // ...call broker...
 * expect(proxy.getFinalPersistedQuestStatus()).toBe('in_progress');
 */

import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  fileContentsContract,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  type FileContents,
  type Quest,
  type QuestStub,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questRecoverRoleBroker } from './quest-recover-role-broker';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questSpliceFixerBrokerProxy } from '../splice-fixer/quest-splice-fixer-broker.proxy';
import { questSplicePathseekerReplanBrokerProxy } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker.proxy';

registerModuleMock({ module: './quest-recover-role-broker' });

type QuestInput = ReturnType<typeof QuestStub>;

const BATCHES_DIR_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches' });
const BATCH_FILE_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches/batch.json' });

export const questRecoverRoleBrokerProxy = (): {
  setupRecovered: () => void;
  setupEscalatedReplan: () => void;
  setupEscalatedBlock: () => void;
  setupRecover: (params: { quest: QuestInput }) => void;
  setupExhaustedReplan: (params: { quest: QuestInput }) => void;
  setupExhaustedBlock: (params: { quest: QuestInput }) => void;
  getCalls: () => readonly (readonly unknown[])[];
  getFinalPersistedWorkItems: () => readonly WorkItem[];
  getFinalPersistedQuestStatus: () => Quest['status'] | undefined;
  getWrittenSidecarContents: () => FileContents | undefined;
} => {
  const mocked = questRecoverRoleBroker as jest.MockedFunction<typeof questRecoverRoleBroker>;
  mocked.mockResolvedValue({ recovered: true, replanned: false, blocked: false });

  fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const extraPathJoin = pathJoinAdapterProxy();
  const findProxy = questFindQuestPathBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const spliceProxy = questSpliceFixerBrokerProxy();
  const replanProxy = questSplicePathseekerReplanBrokerProxy();

  const passthrough = (): void => {
    const realMod = requireActual<{ questRecoverRoleBroker: typeof questRecoverRoleBroker }>({
      module: './quest-recover-role-broker',
    });
    mocked.mockImplementation(realMod.questRecoverRoleBroker);
  };

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
    // Caller stubs.
    setupRecovered: (): void => {
      mocked.mockResolvedValueOnce({ recovered: true, replanned: false, blocked: false });
    },
    setupEscalatedReplan: (): void => {
      mocked.mockResolvedValueOnce({ recovered: false, replanned: true, blocked: false });
    },
    setupEscalatedBlock: (): void => {
      mocked.mockResolvedValueOnce({ recovered: false, replanned: false, blocked: true });
    },

    // Own-test passthrough: budget remaining runs the real spiritmender + ward + fresh-role splice.
    setupRecover: ({ quest }: { quest: QuestInput }): void => {
      passthrough();
      getProxy.setupQuestFound({ quest });
      setupFindQuestPathForBroker({ quest });
      extraPathJoin.returns({ result: BATCHES_DIR_PATH });
      extraPathJoin.returns({ result: BATCH_FILE_PATH });
      spliceProxy.setupQuestModify({ quest });
      replanProxy.setupReplanned();
    },
    setupExhaustedReplan: ({ quest }: { quest: QuestInput }): void => {
      passthrough();
      getProxy.setupQuestFound({ quest });
      replanProxy.setupReplanned();
    },
    setupExhaustedBlock: ({ quest }: { quest: QuestInput }): void => {
      passthrough();
      getProxy.setupQuestFound({ quest });
      replanProxy.setupBlocked();
    },

    getCalls: (): readonly (readonly unknown[])[] => mocked.mock.calls,

    getFinalPersistedWorkItems: (): readonly WorkItem[] => {
      const spliced = spliceProxy.getPersistedQuests();
      const lastSpliced = spliced[spliced.length - 1];
      return lastSpliced === undefined ? [] : lastSpliced.workItems;
    },

    getFinalPersistedQuestStatus: (): Quest['status'] | undefined => {
      const spliced = spliceProxy.getPersistedQuests();
      const lastSpliced = spliced[spliced.length - 1];
      return lastSpliced === undefined ? undefined : lastSpliced.status;
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
