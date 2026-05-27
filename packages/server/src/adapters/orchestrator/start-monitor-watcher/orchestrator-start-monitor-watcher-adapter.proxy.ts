import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const orchestratorStartMonitorWatcherAdapterProxy = (): {
  resolves: () => void;
  throws: (params: { error: Error }) => void;
  wasStopCalled: () => boolean;
} => {
  const mock = registerMock({ fn: StartOrchestrator.startMonitorWatcher });
  const stopState = { called: false };

  mock.mockImplementation(async () =>
    Promise.resolve({
      stop: (): void => {
        stopState.called = true;
      },
    }),
  );

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
  };
};
