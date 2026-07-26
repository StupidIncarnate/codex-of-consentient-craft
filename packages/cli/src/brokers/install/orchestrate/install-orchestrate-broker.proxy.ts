import { InstallResultStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { installExecuteBrokerProxy } from '../execute/install-execute-broker.proxy';

export const installOrchestrateBrokerProxy = (): {
  setupImport: (params: { installPath: FilePath; module: unknown }) => void;
  setupOverlapRecordingInstalls: (params: { installPaths: FilePath[] }) => void;
  hadOverlappingInstalls: () => boolean;
} => {
  const installExecuteProxy = installExecuteBrokerProxy();
  const inFlight = { count: 0, overlapped: false };

  return {
    // Keyed on installPath — the broker calls installExecuteBroker once per package with that
    // package's own installPath, so each package the caller cares about needs its own call.
    setupImport: ({ installPath, module }: { installPath: FilePath; module: unknown }): void => {
      installExecuteProxy.setupImport({ installPath, module });
    },

    // Every StartInstall marks itself in-flight, yields the event loop, then marks itself done.
    // Sequential installs never see a second install in flight; concurrent ones do — which is
    // how two installs writing the same file (.claude/settings.json) lose each other's writes.
    // The caller passes every package's installPath so the SAME overlap-recording module answers
    // for each one — installOrchestrateBroker calls a different installPath per package.
    setupOverlapRecordingInstalls: ({ installPaths }: { installPaths: FilePath[] }): void => {
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
      for (const installPath of installPaths) {
        installExecuteProxy.setupImport({ installPath, module });
      }
    },

    hadOverlappingInstalls: (): boolean => inFlight.overlapped,
  };
};
