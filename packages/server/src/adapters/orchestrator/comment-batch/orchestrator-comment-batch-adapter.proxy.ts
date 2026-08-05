import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ProcessIdStub, QuestId } from '@dungeonmaster/shared/contracts';

type ProcessId = ReturnType<typeof ProcessIdStub>;

export const orchestratorCommentBatchAdapterProxy = (): {
  returns: (params: { questId: QuestId; chatProcessId: ProcessId; message: string }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  getLastCalledArgs: (params: { questId: QuestId }) => unknown;
  getCalls: (params: { questId: QuestId }) => unknown[];
} => {
  const mock = registerMock({ fn: StartOrchestrator.commentBatch });

  return {
    // `message` is the markdown turn the orchestrator handed the agent — the caller names it so a
    // test can assert the server relays that exact text back to the browser.
    returns: ({
      questId,
      chatProcessId,
      message,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
      message: string;
    }): void => {
      mock.calledWith([{ questId }]).resolves({ chatProcessId, message });
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    getLastCalledArgs: ({ questId }: { questId: QuestId }): unknown =>
      mock.callsMatching([{ questId }]).at(-1)?.[0],
    // Returns every delivery attempt for this quest, so a test can assert an empty array — the
    // "zero chat processes spawned" guarantee on the 409 and persist-failure paths.
    getCalls: ({ questId }: { questId: QuestId }): unknown[] => mock.callsMatching([{ questId }]),
  };
};
