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
 * WHY registerModuleMock: questPauseBroker must be a mockable jest.fn() so callers in other
 * files resolve through the mocked module. calledWith/onceFor below answer by ARGUMENTS, not by
 * which file is calling, so every caller sees the same staged behaviour globally.
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

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
  const mocked = registerMock({ fn: questPauseBroker });
  // questId/guildId/previousStatus vary per call but neither the stub result nor the passthrough
  // depends on which quest was paused — `[]` is the honest address for both.
  mocked.calledWith([]).resolves({ paused: true });

  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupPaused: (): void => {
      mocked.onceFor([]).resolves({ paused: true });
    },

    setupNotPaused: (): void => {
      mocked.onceFor([]).resolves({ paused: false });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{ questPauseBroker: typeof questPauseBroker }>({
        module: './quest-pause-broker',
      });
      mocked.calledWith([]).implement(realMod.questPauseBroker as never);
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

    getCallArgs: (): readonly unknown[][] => mocked.callsMatching([]),
  };
};
