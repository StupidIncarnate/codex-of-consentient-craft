/**
 * PURPOSE: Proxy for questSplicePathseekerReplanBroker — two roles:
 *   1) Downstream callers (signal-back handler, questRecoverRoleBroker, run-ward broker) stub the
 *      broker via setupReplanned / setupBlocked.
 *   2) The broker's own test runs the real implementation (setupReplan / setupExhausted) and composes
 *      the quest-get, quest-modify-or-throw, and quest-block-on-failure proxies so the full flow
 *      exercises real code.
 *
 * USAGE (caller test):
 * const proxy = questSplicePathseekerReplanBrokerProxy();
 * proxy.setupReplanned();
 *
 * USAGE (broker test):
 * const proxy = questSplicePathseekerReplanBrokerProxy();
 * proxy.setupReplan({ quest });
 * // ...call broker...
 * const persisted = proxy.getLastPersistedQuest();
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questSplicePathseekerReplanBroker } from './quest-splice-pathseeker-replan-broker';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyOrThrowBrokerProxy } from '../modify-or-throw/quest-modify-or-throw-broker.proxy';

registerModuleMock({ module: './quest-splice-pathseeker-replan-broker' });

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questSplicePathseekerReplanBrokerProxy = (): {
  setupReplanned: () => void;
  setupBlocked: () => void;
  setupReplan: (params: { quest: Quest }) => void;
  setupExhausted: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getCalls: () => readonly (readonly unknown[])[];
  getLastPersistedQuest: () => Parsed;
} => {
  const mocked = questSplicePathseekerReplanBroker as jest.MockedFunction<
    typeof questSplicePathseekerReplanBroker
  >;
  mocked.mockResolvedValue({ replanned: true, blocked: false });

  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyOrThrowBrokerProxy();
  const blockProxy = questBlockOnFailureBrokerProxy();

  const passthrough = (): void => {
    const realMod = requireActual<{
      questSplicePathseekerReplanBroker: typeof questSplicePathseekerReplanBroker;
    }>({ module: './quest-splice-pathseeker-replan-broker' });
    mocked.mockImplementation(realMod.questSplicePathseekerReplanBroker);
  };

  return {
    // Caller stubs: a plan-hole escalation replanned (quest stays in_progress) or blocked (loop spent).
    setupReplanned: (): void => {
      mocked.mockResolvedValueOnce({ replanned: true, blocked: false });
    },
    setupBlocked: (): void => {
      mocked.mockResolvedValueOnce({ replanned: false, blocked: true });
    },
    // Budget remaining: the real broker loads the quest, marks the failed item failed, skips pending,
    // and splices a pathseeker replan via questModifyOrThrowBroker. Block is stubbed (never reached).
    setupReplan: ({ quest }: { quest: Quest }): void => {
      passthrough();
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      blockProxy.setupBlocked();
    },
    // Budget exhausted: the real broker delegates to questBlockOnFailureBroker (stubbed → { blocked:
    // true }). The block broker's own persist is covered by its own test + the integration test; here
    // the exhausted test asserts the broker's { replanned: false, blocked: true } return.
    setupExhausted: ({ quest }: { quest: Quest }): void => {
      passthrough();
      getProxy.setupQuestFound({ quest });
      blockProxy.setupBlocked();
    },
    setupQuestNotFound: (): void => {
      passthrough();
      getProxy.setupEmptyFolder();
    },
    getCalls: (): readonly (readonly unknown[])[] => mocked.mock.calls,
    getLastPersistedQuest: (): Parsed => {
      const spliced = modifyProxy.getAllPersistedContents();
      const lastSplice = spliced[spliced.length - 1];
      return questContract.parse(
        JSON.parse(typeof lastSplice === 'string' ? lastSplice : String(lastSplice)),
      );
    },
  };
};
