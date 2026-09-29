/**
 * PURPOSE: Proxy for quest-get-broker that mocks quest find and quest load operations
 *
 * USAGE:
 * const proxy = questGetBrokerProxy();
 * proxy.setupQuestFound({ quest });
 */

import { join } from '#gateway/node/path';

import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questGetBroker } from './quest-get-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type GetInput = Parameters<typeof questGetBroker>[0]['input'];
type GetResult = Awaited<ReturnType<typeof questGetBroker>>;

registerModuleMock({ module: './quest-get-broker' });

export const questGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
  // Runs the real lookup for one quest id whose own fs staging a composing proxy (or a lookup for
  // an id the staged quest does not hold) already made.
  setupRealLookup: (params: { questId: Quest['id'] }) => void;
  // Answers one exact `input` with a caller-chosen result, without running the lookup — for a
  // caller asserting on the `error` text of a `{ success: false, error }`. Any other input runs the
  // real broker.
  setupResolves: (params: { input: GetInput; result: GetResult }) => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const realMod = requireActual<{ questGetBroker: typeof questGetBroker }>({
    module: './quest-get-broker',
  });
  const getMock = registerMock({ fn: questGetBroker });
  // Any `{ input }` call, for the opt-in `setupEmptyFolder` whose lookup id the test never names.
  const isGetCall = (call: unknown): boolean =>
    typeof call === 'object' && call !== null && 'input' in call;

  return {
    setupResolves: ({ input, result }: { input: GetInput; result: GetResult }): void => {
      getMock.calledWith([{ input }]).resolves(result);
    },

    setupRealLookup: ({ questId }: { questId: Quest['id'] }): void => {
      getMock.calledWith([{ input: { questId } }]).implement(realMod.questGetBroker as never);
    },

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
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

      // questGetBroker's own join(questPath, quest.json) -> questFilePath, addressed by the exact
      // tuple rather than an address-less FIFO slot, so it can never answer a different broker's
      // join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      getMock
        .calledWith([{ input: { questId: quest.id } }])
        .implement(realMod.questGetBroker as never);
    },

    setupEmptyFolder: (): void => {
      getMock.calledWith([isGetCall]).implement(realMod.questGetBroker as never);
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },
  };
};
