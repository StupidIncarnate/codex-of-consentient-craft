import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type StartWatcherParams = Parameters<typeof StartOrchestrator.startMonitorWatcher>[0];

export const orchestratorStartMonitorWatcherAdapterProxy = (): {
  resolves: () => void;
  throws: (params: { error: Error }) => void;
  wasStopCalled: () => boolean;
  startedWithWorkerWorkItemId: (params: {
    parentSessionId: string;
    workerWorkItemId: string;
  }) => boolean;
  startedWithoutWorkerWorkItemId: (params: { parentSessionId: string }) => boolean;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startMonitorWatcher });
  const stopState = { called: false };
  // Capture each call's params through the base impl so the assertions below read typed
  // fields — registerMock's `mock.calls` is `unknown[][]`, so it can't be inspected directly.
  const calls: StartWatcherParams[] = [];

  mock.mockImplementation(async (params: StartWatcherParams) => {
    calls.push(params);
    return Promise.resolve({
      stop: (): void => {
        stopState.called = true;
      },
    });
  });

  return {
    resolves: (): void => {
      mock.mockImplementationOnce(async () =>
        Promise.resolve({
          stop: (): void => {
            stopState.called = true;
          },
        }),
      );
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
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
    }): boolean =>
      calls.some(
        (call) =>
          call.parentSessionId === parentSessionId && call.workerWorkItemId === workerWorkItemId,
      ),
    startedWithoutWorkerWorkItemId: ({ parentSessionId }: { parentSessionId: string }): boolean =>
      calls.some(
        (call) => call.parentSessionId === parentSessionId && call.workerWorkItemId === undefined,
      ),
  };
};
