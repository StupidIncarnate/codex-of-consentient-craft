import * as guildSessionListBrokerModule from '../../brokers/guild/session-list/guild-session-list-broker';

import type { SessionListItemStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { guildSessionListBrokerProxy } from '../../brokers/guild/session-list/guild-session-list-broker.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;

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

export const useSessionListBindingProxy = (): {
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupError: () => void;
  setupOuterCatchTrigger: () => void;
  getConsoleErrorCalls: () => SpyOnHandle['mock']['calls'];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const brokerProxy = guildSessionListBrokerProxy();
  const consoleErrorHandle = registerSpyOn({ object: globalThis.console, method: 'error' });

  return {
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      brokerProxy.setupSessions({ sessions });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle = registerSpyOn({
        object: guildSessionListBrokerModule,
        method: 'guildSessionListBroker',
      });
      brokerHandle.mockImplementation(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): SpyOnHandle['mock']['calls'] => consoleErrorHandle.mock.calls,
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
