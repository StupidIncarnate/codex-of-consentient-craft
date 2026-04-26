/**
 * PURPOSE: Proxy for quest-pause-broker — two roles:
 *   1) Downstream responder tests stub the broker via setupPaused / setupNotPaused.
 *   2) The broker's own test runs the real implementation (setupPassthrough) and composes
 *      questGet/questModify proxies so the full pause flow exercises real code.
 *
 * USAGE (responder test):
 * const proxy = questPauseBrokerProxy();
 * proxy.setupPaused();
 *
 * USAGE (broker test):
 * const proxy = questPauseBrokerProxy();
 * proxy.setupPassthrough();
 * proxy.setupQuestFound({ quest });
 * // ...call broker...
 * const persisted = proxy.getLastPersistedQuest();
 *
 * WHY registerModuleMock: callers of questPauseBroker live in different files; stack-based
 * registerMock dispatch won't match those callers. registerModuleMock + jest.mocked gives
 * all callers the mocked version globally, matching the questModifyBroker pattern.
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questPauseBroker } from './quest-pause-broker';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

registerModuleMock({ module: './quest-pause-broker' });

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questPauseBrokerProxy = (): {
  setupPaused: () => void;
  setupNotPaused: () => void;
  setupPassthrough: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
  getCallArgs: () => readonly unknown[][];
} => {
  const mocked = questPauseBroker as jest.MockedFunction<typeof questPauseBroker>;
  mocked.mockResolvedValue({ paused: true });

  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupPaused: (): void => {
      mocked.mockResolvedValueOnce({ paused: true });
    },

    setupNotPaused: (): void => {
      mocked.mockResolvedValueOnce({ paused: false });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{ questPauseBroker: typeof questPauseBroker }>({
        module: './quest-pause-broker',
      });
      mocked.mockImplementation(realMod.questPauseBroker);
    },

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): Parsed => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(
        JSON.parse(typeof lastWrite === 'string' ? lastWrite : String(lastWrite)),
      );
    },

    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
