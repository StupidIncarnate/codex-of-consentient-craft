/**
 * PURPOSE: Proxy for orchestrator-get-quest-work-adapter that mocks the orchestrator package.
 *
 * USAGE:
 * const proxy = orchestratorGetQuestWorkAdapterProxy();
 * proxy.returns({ questId: 'add-auth', result: { view: proxy.defaultView(), planText: null } });
 *
 * `defaultView()` is here rather than in each test because `QuestWorkViewStub` lives in
 * `@dungeonmaster/orchestrator/testing`, and only an ADAPTER may import another package — a
 * responder's own test file is refused by the import rules. Every caller that needs a real view to
 * assert serialization against reaches it through this one method.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { QuestWorkViewStub } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GetQuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestWork>>;
type QuestWorkView = ReturnType<typeof QuestWorkViewStub>;

export const orchestratorGetQuestWorkAdapterProxy = (): {
  returns: (params: { questId: string; result: GetQuestWorkResult }) => void;
  throws: (params: { questId: string; error: Error }) => void;
  getLastCalledInputFor: (params: { questId: string }) => unknown;
  defaultView: () => QuestWorkView;
} => {
  const handle = registerMock({ fn: StartOrchestrator.getQuestWork });

  return {
    // `questId` alone is the address: the two call shapes differ by which SECOND id they carry, and
    // describing one of them here would leave the other unstaged and throwing.
    returns: ({ questId, result }: { questId: string; result: GetQuestWorkResult }): void => {
      handle.calledWith([{ questId }]).resolves(result);
    },
    throws: ({ questId, error }: { questId: string; error: Error }): void => {
      handle.calledWith([{ questId }]).rejects(error);
    },
    getLastCalledInputFor: ({ questId }: { questId: string }): unknown =>
      handle.callsMatching([{ questId }]).at(-1)?.[0],
    defaultView: (): QuestWorkView => QuestWorkViewStub(),
  };
};
