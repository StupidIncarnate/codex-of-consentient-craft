import * as guildDetailBrokerModule from '../../brokers/guild/detail/guild-detail-broker';

import type { GuildStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { guildDetailBrokerProxy } from '../../brokers/guild/detail/guild-detail-broker.proxy';

type Guild = ReturnType<typeof GuildStub>;

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

export const useGuildDetailBindingProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupError: () => void;
  setupOuterCatchTrigger: () => void;
  getConsoleErrorCalls: () => SpyOnHandle['mock']['calls'];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const brokerProxy = guildDetailBrokerProxy();
  const consoleErrorHandle = registerSpyOn({ object: globalThis.console, method: 'error' });

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      brokerProxy.setupGuild({ guild });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle = registerSpyOn({
        object: guildDetailBrokerModule,
        method: 'guildDetailBroker',
      });
      brokerHandle.mockImplementation(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): SpyOnHandle['mock']['calls'] => consoleErrorHandle.mock.calls,
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
