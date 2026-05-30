/**
 * PURPOSE: Proxy for questBlockOnFailureBroker — two roles:
 *   1) Downstream callers (signal-back handler, run-ward broker) stub the broker via setupBlocked.
 *   2) The broker's own test runs the real implementation (setupPassthrough) and composes
 *      questGet/questModify proxies so the full block flow exercises real code.
 *
 * USAGE (caller test):
 * const proxy = questBlockOnFailureBrokerProxy();
 * proxy.setupBlocked();
 *
 * USAGE (broker test):
 * const proxy = questBlockOnFailureBrokerProxy();
 * proxy.setupPassthrough();
 * proxy.setupQuestFound({ quest });
 * // ...call broker...
 * const persisted = proxy.getLastPersistedQuest();
 *
 * WHY registerModuleMock: callers of questBlockOnFailureBroker live in different files; stack-based
 * registerMock dispatch won't match those callers. registerModuleMock + jest.mocked gives all
 * callers the mocked version globally, matching the questPauseBroker / questModifyBroker pattern.
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questBlockOnFailureBroker } from './quest-block-on-failure-broker';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

registerModuleMock({ module: './quest-block-on-failure-broker' });

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questBlockOnFailureBrokerProxy = (): {
  setupBlocked: () => void;
  setupPassthrough: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
} => {
  const mocked = questBlockOnFailureBroker as jest.MockedFunction<typeof questBlockOnFailureBroker>;
  mocked.mockResolvedValue({ blocked: true });

  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupBlocked: (): void => {
      mocked.mockResolvedValueOnce({ blocked: true });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{
        questBlockOnFailureBroker: typeof questBlockOnFailureBroker;
      }>({ module: './quest-block-on-failure-broker' });
      mocked.mockImplementation(realMod.questBlockOnFailureBroker);
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
  };
};
