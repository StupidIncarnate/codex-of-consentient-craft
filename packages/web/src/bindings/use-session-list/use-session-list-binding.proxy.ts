import * as guildSessionListBrokerModule from '../../brokers/guild/session-list/guild-session-list-broker';

import type { SessionListItemStub } from '@dungeonmaster/shared/contracts';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
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
  setupOuterCatchTrigger: (params: { guildId: string }) => void;
  getConsoleErrorCalls: () => unknown[][];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const CONSOLE_ERROR_TAG = '[use-session-list]';
  const brokerProxy = guildSessionListBrokerProxy();
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith([CONSOLE_ERROR_TAG]).returns(undefined);

  return {
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      brokerProxy.setupSessions({ sessions });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: ({ guildId }: { guildId: string }): void => {
      const brokerHandle: MockHandle = registerSpyOn({
        object: guildSessionListBrokerModule,
        method: 'guildSessionListBroker',
      });
      brokerHandle.calledWith([{ guildId }]).implement(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): unknown[][] => consoleErrorHandle.callsMatching([CONSOLE_ERROR_TAG]),
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
