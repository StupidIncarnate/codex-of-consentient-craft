import * as guildDetailBrokerModule from '../../brokers/guild/detail/guild-detail-broker';

import type { GuildStub } from '@dungeonmaster/shared/contracts';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
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
  setupOuterCatchTrigger: (params: { guildId: string }) => void;
  getConsoleErrorCalls: () => unknown[][];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const CONSOLE_ERROR_TAG = '[use-guild-detail]';
  const brokerProxy = guildDetailBrokerProxy();
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith([CONSOLE_ERROR_TAG]).returns(undefined);

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      brokerProxy.setupGuild({ guild });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: ({ guildId }: { guildId: string }): void => {
      const brokerHandle: MockHandle = registerSpyOn({
        object: guildDetailBrokerModule,
        method: 'guildDetailBroker',
      });
      brokerHandle.calledWith([{ guildId }]).implement(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): unknown[][] => consoleErrorHandle.callsMatching([CONSOLE_ERROR_TAG]),
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
