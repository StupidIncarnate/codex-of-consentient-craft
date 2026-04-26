/**
 * PURPOSE: Proxy for questEnqueueRecoverableBroker — registerModuleMock so the bootstrap
 * responder test can assert "was the recovery sweep dispatched?" without driving the full
 * guild/quest list chain. The broker's own test calls setupPassthrough and seeds
 * direct-guild / direct-quest-list / direct-listing helpers to exercise the real filter +
 * sort + enqueue logic.
 */

import type { GuildId, GuildListItem, GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { EnqueuedCountStub } from '../../../contracts/enqueued-count/enqueued-count.stub';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questListBrokerProxy } from '../list/quest-list-broker.proxy';
import { questEnqueueRecoverableBroker } from './quest-enqueue-recoverable-broker';

registerModuleMock({ module: './quest-enqueue-recoverable-broker' });

type EnqueuedCount = ReturnType<typeof EnqueuedCountStub>;
type Guild = ReturnType<typeof GuildStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questEnqueueRecoverableBrokerProxy = (): {
  reset: () => void;
  setupEnqueuedCount: (params: { count: EnqueuedCount }) => void;
  setupRejects: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  setupDirectGuildListing: (params: { items: readonly GuildListItem[] }) => void;
  setupDirectGuild: (params: { guild: Guild }) => void;
  setupDirectQuestList: (params: { guildId: GuildId; quests: readonly Quest[] }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const guildListProxy = guildListBrokerProxy();
  const guildGetProxy = guildGetBrokerProxy();
  const questListProxy = questListBrokerProxy();

  const mocked = questEnqueueRecoverableBroker as jest.MockedFunction<
    typeof questEnqueueRecoverableBroker
  >;
  // Default: zero recoverable.
  mocked.mockResolvedValue({ enqueuedCount: EnqueuedCountStub({ value: 0 }) });

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupEnqueuedCount: ({ count }: { count: EnqueuedCount }): void => {
      mocked.mockResolvedValueOnce({ enqueuedCount: count });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        questEnqueueRecoverableBroker: typeof questEnqueueRecoverableBroker;
      }>({ module: './quest-enqueue-recoverable-broker' });
      mocked.mockImplementation(realMod.questEnqueueRecoverableBroker);
    },
    setupDirectGuildListing: ({ items }: { items: readonly GuildListItem[] }): void => {
      guildListProxy.setupDirectListing({ items });
    },
    setupDirectGuild: ({ guild }: { guild: Guild }): void => {
      guildGetProxy.setupDirectGuild({ guild });
    },
    setupDirectQuestList: ({
      guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: readonly Quest[];
    }): void => {
      questListProxy.setupDirectList({ guildId, quests });
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
