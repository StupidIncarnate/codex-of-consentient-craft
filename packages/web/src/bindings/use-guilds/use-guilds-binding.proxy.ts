import * as guildListBrokerModule from '../../brokers/guild/list/guild-list-broker';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { guildListBrokerProxy } from '../../brokers/guild/list/guild-list-broker.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

const createPoisonError = (): Error => {
  const error = new Error('poison');
  Object.setPrototypeOf(error, Object.prototype);
  Object.defineProperty(error, 'toString', {
    value: (): never => {
      throw new Error('poison toString');
    },
  });

  return error;
};

const rejectWithPoisonToString = async (): Promise<never> => {
  await Promise.resolve();
  throw createPoisonError();
};

export const useGuildsBindingProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupError: () => void;
  setupOuterCatchTrigger: () => void;
  getConsoleErrorCalls: () => SpyOnHandle['mock']['calls'];
} => {
  const brokerProxy = guildListBrokerProxy();
  const consoleErrorHandle = registerSpyOn({ object: globalThis.console, method: 'error' });

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      brokerProxy.setupGuilds({ guilds });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle = registerSpyOn({
        object: guildListBrokerModule,
        method: 'guildListBroker',
      });
      brokerHandle.mockImplementation(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): SpyOnHandle['mock']['calls'] => consoleErrorHandle.mock.calls,
  };
};
