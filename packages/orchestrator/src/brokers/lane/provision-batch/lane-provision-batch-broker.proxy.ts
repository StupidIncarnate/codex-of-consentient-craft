/**
 * PURPOSE: Proxy for lane-provision-batch-broker — composes questFindQuestPathBrokerProxy (the
 * implementation's ONE guildId/questPath resolution for the whole batch), laneRecordInstanceBrokerProxy
 * (the write half, queued once per lane a scenario actually starts), and the ONE
 * runtimeDynamicImportAdapterProxy staging that answers BOTH `capacityReadBroker` and
 * `instanceStartBroker` for siegelense's single `brokers` module path — one combined `.succeeds()`
 * call, because two separate stagings of the identical path would collide (registerMock addresses
 * purely by argument, and the later stage silently wins).
 *
 * USAGE:
 * const proxy = laneProvisionBatchBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupCapacityAndManifest({ suggested: 1, manifest: LaneManifestReadingStub() });
 * // ...call laneProvisionBatchBroker...
 * const persisted = proxy.getLastPersistedQuest();
 */

import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  absoluteFilePathContract,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub, questContract } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { laneRecordInstanceBrokerProxy } from '../record-instance/lane-record-instance-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

// The heaviest scenario in this suite starts three lanes — each running its OWN
// join→load→persist cycle inside laneRecordInstanceBroker, now that questPath is resolved ONCE
// upfront rather than re-resolved per lane. This many queued write cycles covers every scenario
// with margin; an unused one is inert.
const RECORD_CYCLE_COUNT = 3;
const RECORD_CYCLES: readonly undefined[] = new Array<undefined>(RECORD_CYCLE_COUNT).fill(
  undefined,
);

export const laneProvisionBatchBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupCapacityAndManifest: (params: { suggested: number; manifest: unknown }) => void;
  getLastPersistedQuest: () => Parsed;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const recordInstanceProxy = laneRecordInstanceBrokerProxy();
  const importProxy = runtimeDynamicImportAdapterProxy();
  const siegelenseBrokersPath = require.resolve('@dungeonmaster/siegelense/brokers');

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
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

      findQuestPathProxy.setupQuestFound({
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

      // Every lane this scenario actually starts runs its OWN join→load→persist cycle against the
      // SAME resolved questPath; queued once per possible lane, ahead of time. questFolderPath is a
      // FilePath above (the union questFindQuestPathBrokerProxy takes) but is genuinely absolute —
      // built with a leading `/` — so it re-parses into the AbsoluteFilePath
      // laneRecordInstanceBrokerProxy requires, rather than widening either proxy's type.
      const absoluteQuestFolderPath = absoluteFilePathContract.parse(questFolderPath);
      RECORD_CYCLES.forEach(() => {
        recordInstanceProxy.setupQuestFound({ quest, questPath: absoluteQuestFolderPath });
      });
    },

    setupCapacityAndManifest: ({
      suggested,
      manifest,
    }: {
      suggested: number;
      manifest: unknown;
    }): void => {
      importProxy.succeeds({
        path: siegelenseBrokersPath,
        module: {
          capacityReadBroker: jest.fn().mockResolvedValue({ suggested }),
          instanceStartBroker: jest.fn().mockResolvedValue(manifest),
        },
      });
    },

    getLastPersistedQuest: recordInstanceProxy.getLastPersistedQuest,
  };
};
