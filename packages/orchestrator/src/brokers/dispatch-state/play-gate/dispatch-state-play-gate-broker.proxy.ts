import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import type { GuildListItem, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../../quest/list/quest-list-broker.proxy';
import { dispatchStateReadBroker } from '../read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../read/dispatch-state-read-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type DispatchState = ReturnType<typeof DispatchStateStub>;

// The gate composes read + guild/quest listing; each has its own deep test suite, so the gate
// tests drive them at the module boundary.
registerModuleMock({ module: '../read/dispatch-state-read-broker' });

export const dispatchStatePlayGateBrokerProxy = (): {
  setupDispatchState: (params: { state: DispatchState }) => void;
  setupGuilds: (params: { items: readonly GuildListItem[] }) => void;
  setupQuests: (params: { guildId: GuildListItem['id']; quests: readonly Quest[] }) => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();
  dispatchStateReadBrokerProxy();

  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  readMock.mockResolvedValue(DispatchStateStub());

  return {
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      readMock.mockResolvedValueOnce(state);
    },

    setupGuilds: ({ items }: { items: readonly GuildListItem[] }): void => {
      guildListProxy.setupDirectListing({ items });
    },

    setupQuests: ({
      guildId,
      quests,
    }: {
      guildId: GuildListItem['id'];
      quests: readonly Quest[];
    }): void => {
      questListProxy.setupDirectList({ guildId, quests });
    },
  };
};
