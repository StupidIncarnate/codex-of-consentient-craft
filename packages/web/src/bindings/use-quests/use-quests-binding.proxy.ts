import * as questListBrokerModule from '../../brokers/quest/list/quest-list-broker';

import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questListBrokerProxy } from '../../brokers/quest/list/quest-list-broker.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

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

export const useQuestsBindingProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: () => void;
  setupOuterCatchTrigger: () => void;
  getConsoleErrorCalls: () => SpyOnHandle['mock']['calls'];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const brokerProxy = questListBrokerProxy();
  const consoleErrorHandle = registerSpyOn({ object: globalThis.console, method: 'error' });

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      brokerProxy.setupQuests({ quests });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupOuterCatchTrigger: (): void => {
      const brokerHandle = registerSpyOn({
        object: questListBrokerModule,
        method: 'questListBroker',
      });
      brokerHandle.mockImplementation(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): SpyOnHandle['mock']['calls'] => consoleErrorHandle.mock.calls,
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
