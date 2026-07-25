import { InstallResultStub } from '@dungeonmaster/shared/contracts';
import { installExecuteBrokerProxy } from '../execute/install-execute-broker.proxy';

export const installOrchestrateBrokerProxy = (): {
  setupImport: (params: { module: unknown }) => void;
  setupOverlapRecordingInstalls: () => void;
  hadOverlappingInstalls: () => boolean;
} => {
  const installExecuteProxy = installExecuteBrokerProxy();
  const inFlight = { count: 0, overlapped: false };

  return {
    setupImport: ({ module }: { module: unknown }): void => {
      installExecuteProxy.setupImport({ module });
    },

    // Every StartInstall marks itself in-flight, yields the event loop, then marks itself done.
    // Sequential installs never see a second install in flight; concurrent ones do — which is
    // how two installs writing the same file (.claude/settings.json) lose each other's writes.
    setupOverlapRecordingInstalls: (): void => {
      const module: Record<PropertyKey, unknown> = {
        StartInstall: async (): Promise<ReturnType<typeof InstallResultStub>> => {
          inFlight.count += 1;
          inFlight.overlapped ||= inFlight.count > 1;
          await Promise.resolve();
          inFlight.count -= 1;
          return InstallResultStub({
            value: { packageName: '@dungeonmaster/cli', success: true, action: 'created' },
          });
        },
      };
      installExecuteProxy.setupImport({ module });
    },

    hadOverlappingInstalls: (): boolean => inFlight.overlapped,
  };
};
