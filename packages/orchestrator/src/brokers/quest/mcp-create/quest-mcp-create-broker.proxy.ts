import {
  QuestIdStub,
  FilePathStub,
  type AddQuestResult,
  type GuildListItem,
} from '@dungeonmaster/shared/contracts';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questUserAddBroker } from '../user-add/quest-user-add-broker';
import { questUserAddBrokerProxy } from '../user-add/quest-user-add-broker.proxy';

registerModuleMock({ module: '../user-add/quest-user-add-broker' });

type QuestId = ReturnType<typeof QuestIdStub>;

export const questMcpCreateBrokerProxy = (): {
  setupMatchingGuild: (params: { cwd: string; guild: GuildListItem; questId?: QuestId }) => void;
  setupGuildsWithMatch: (params: {
    cwd: string;
    guilds: readonly GuildListItem[];
    questId?: QuestId;
  }) => void;
  setupNoMatchingGuild: (params: { cwd: string; guilds: readonly GuildListItem[] }) => void;
  setupEmptyGuildList: (params: { cwd: string }) => void;
  setupAddFailure: (params: { cwd: string; guild: GuildListItem; error: string }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const listProxy = guildListBrokerProxy();
  // Initializing the user-add proxy registers its companion mocks; we still override the
  // top-level mock per setup case below so this broker resolves through user-add cleanly.
  questUserAddBrokerProxy();

  const listMock = guildListBroker as jest.MockedFunction<typeof guildListBroker>;
  const addMock = questUserAddBroker as jest.MockedFunction<typeof questUserAddBroker>;

  // Defaults: ensure we never accidentally pick up the real implementations between tests.
  listMock.mockResolvedValue([]);

  const stageSuccessfulAdd = ({ questId }: { questId: QuestId }): void => {
    const addResult = {
      success: true,
      questId,
      questFolder: questId,
      filePath: FilePathStub({ value: '/tmp/quest.json' }),
      chaoswhispererWorkItemId: questId,
    } as unknown as AddQuestResult;
    addMock.mockResolvedValueOnce(addResult);
  };

  return {
    setupMatchingGuild: ({
      cwd,
      guild,
      questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    }: {
      cwd: string;
      guild: GuildListItem;
      questId?: QuestId;
    }): void => {
      cwdProxy.returns({ path: cwd });
      listProxy.setupDirectListing({ items: [guild] });
      stageSuccessfulAdd({ questId });
    },

    setupGuildsWithMatch: ({
      cwd,
      guilds,
      questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    }: {
      cwd: string;
      guilds: readonly GuildListItem[];
      questId?: QuestId;
    }): void => {
      cwdProxy.returns({ path: cwd });
      listProxy.setupDirectListing({ items: guilds });
      stageSuccessfulAdd({ questId });
    },

    setupNoMatchingGuild: ({
      cwd,
      guilds,
    }: {
      cwd: string;
      guilds: readonly GuildListItem[];
    }): void => {
      cwdProxy.returns({ path: cwd });
      listProxy.setupDirectListing({ items: guilds });
    },

    setupEmptyGuildList: ({ cwd }: { cwd: string }): void => {
      cwdProxy.returns({ path: cwd });
      listProxy.setupDirectListing({ items: [] as readonly GuildListItem[] });
    },

    setupAddFailure: ({
      cwd,
      guild,
      error,
    }: {
      cwd: string;
      guild: GuildListItem;
      error: string;
    }): void => {
      cwdProxy.returns({ path: cwd });
      listProxy.setupDirectListing({ items: [guild] });

      const addResult = {
        success: false,
        error,
      } as unknown as AddQuestResult;
      addMock.mockResolvedValueOnce(addResult);
    },
  };
};
