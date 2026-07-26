import * as questListBrokerModule from '../../brokers/quest/list/quest-list-broker';

import type { QuestListItemStub, SkippedQuestFileStub } from '@dungeonmaster/shared/contracts';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { questListBrokerProxy } from '../../brokers/quest/list/quest-list-broker.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

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
  setupQuestsWithSkips: (params: { quests: QuestListItem[]; skipped: SkippedQuestFile[] }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
  setupOuterCatchTrigger: (params: { guildId: string }) => void;
  getConsoleErrorCalls: () => unknown[][];
  getConsoleErrorHandle: () => SpyOnHandle;
} => {
  const CONSOLE_ERROR_TAG = '[use-quests]';
  const brokerProxy = questListBrokerProxy();
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith([CONSOLE_ERROR_TAG]).returns(undefined);

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      brokerProxy.setupQuests({ quests });
    },
    setupQuestsWithSkips: ({
      quests,
      skipped,
    }: {
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      brokerProxy.setupQuestsWithSkips({ quests, skipped });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      brokerProxy.setupInvalidResponse({ data });
    },
    setupOuterCatchTrigger: ({ guildId }: { guildId: string }): void => {
      const brokerHandle: MockHandle = registerSpyOn({
        object: questListBrokerModule,
        method: 'questListBroker',
      });
      brokerHandle.calledWith([{ guildId }]).implement(rejectWithPoisonToString as never);
    },
    getConsoleErrorCalls: (): unknown[][] => consoleErrorHandle.callsMatching([CONSOLE_ERROR_TAG]),
    getConsoleErrorHandle: (): SpyOnHandle => consoleErrorHandle,
  };
};
