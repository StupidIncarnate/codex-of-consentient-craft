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
  };
};
