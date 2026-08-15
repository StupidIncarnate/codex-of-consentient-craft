import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type StartWatcherParams = Parameters<typeof StartOrchestrator.startMonitorWatcher>[0];

export const orchestratorStartMonitorWatcherAdapterProxy = (): {
  resolves: (params: { parentSessionId: string }) => void;
  throws: (params: { parentSessionId: string; error: Error }) => void;
  wasStopCalled: () => boolean;
  startedWithWorkerWorkItemId: (params: {
    parentSessionId: string;
    workerWorkItemId: string;
  }) => boolean;
  startedWithoutWorkerWorkItemId: (params: { parentSessionId: string }) => boolean;
  startedWithWorkerQuestId: (params: { parentSessionId: string; workerQuestId: string }) => boolean;
  // Claude CLI encodes the JSONL directory from the child's cwd, so this is the value that decides
  // whether the tail watches the file the agent is actually writing or one that never appears.
  startedWithProjectDir: (params: { parentSessionId: string; projectDir: string }) => boolean;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startMonitorWatcher });
  const stopState = { called: false };

  return {
    resolves: ({ parentSessionId }: { parentSessionId: string }): void => {
      mock.calledWith([{ parentSessionId }]).implement(async () =>
        Promise.resolve({
          stop: (): void => {
            stopState.called = true;
          },
        }),
      );
    },
    throws: ({ parentSessionId, error }: { parentSessionId: string; error: Error }): void => {
      mock.calledWith([{ parentSessionId }]).rejects(error);
    },
    wasStopCalled: (): boolean => stopState.called,
    // A node-dispatch worker session must be started WITH its owning workItemId so the
    // watcher tails it under the unfiltered `proc-worker-` prefix and routes content to
    // the row. A /dumpster-launch dispatcher session must be started WITHOUT it.
    startedWithWorkerWorkItemId: ({
      parentSessionId,
      workerWorkItemId,
    }: {
      parentSessionId: string;
      workerWorkItemId: string;
    }): boolean => mock.callsMatching([{ parentSessionId, workerWorkItemId }]).length > 0,
    startedWithoutWorkerWorkItemId: ({ parentSessionId }: { parentSessionId: string }): boolean =>
      mock
        .callsMatching([{ parentSessionId }])
        .some((call) => (call[0] as StartWatcherParams).workerWorkItemId === undefined),
    // The tail's stop-time terminal event is a per-quest wire event, so a worker session started
    // without its owning questId emits a frame no subscriber receives.
    startedWithWorkerQuestId: ({
      parentSessionId,
      workerQuestId,
    }: {
      parentSessionId: string;
      workerQuestId: string;
    }): boolean => mock.callsMatching([{ parentSessionId, workerQuestId }]).length > 0,
    startedWithProjectDir: ({
      parentSessionId,
      projectDir,
    }: {
      parentSessionId: string;
      projectDir: string;
    }): boolean => mock.callsMatching([{ parentSessionId, projectDir }]).length > 0,
  };
};
