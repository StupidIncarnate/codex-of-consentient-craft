import { portResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { getPlatformProxy } from '#gateway/node/process/get-platform/get-platform.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { runFireAndForgetProxy } from '#gateway/node/child_process/run-fire-and-forget/run-fire-and-forget.proxy';
import { httpBackendPackageResolveBrokerProxy } from '../../../brokers/http-backend-package/resolve/http-backend-package-resolve-broker.proxy';
import { CliServeResponder } from './cli-serve-responder';

const PORT = '3737';
const SERVER_URL = `http://${environmentStatics.hostname}:${PORT}`;
const SERVER_PACKAGE_NAME = '@dungeonmaster/server';

export const CliServeResponderProxy = ({
  StartServer,
}: {
  StartServer: jest.Mock;
}): {
  callResponder: typeof CliServeResponder;
  setupPlatform: (params: { platform: NodeJS.Platform }) => void;
  getStdoutOutput: () => readonly unknown[];
  getBrowserOpenCalls: (params: {
    command: string | ((command: unknown) => boolean);
  }) => readonly unknown[][];
} => {
  const execProxy = runFireAndForgetProxy();

  // The responder no longer hardcodes a package name — it asks httpBackendPackageResolveBroker,
  // which itself runs real (brokers are not mocked in this repo's tests) with only its own
  // adapter boundary staged. Steering it at '@dungeonmaster/server' here is what makes the
  // require.resolve() below — the real, same-process address the responder's own call also
  // computes — the correct one to stage the dynamic import against.
  const backendResolveProxy = httpBackendPackageResolveBrokerProxy();
  backendResolveProxy.setupOwnDependencies({ dependencyNames: [SERVER_PACKAGE_NAME] });
  backendResolveProxy.setupCandidateHono({ candidateName: SERVER_PACKAGE_NAME });

  const serverPath = require.resolve(SERVER_PACKAGE_NAME);
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });
  importHandle.calledWith([{ path: serverPath }]).resolves({ StartServer });
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: PORT });

  const platformStage = getPlatformProxy();
  const stdout = stdoutProxy();

  return {
    callResponder: CliServeResponder,

    setupPlatform: ({ platform }: { platform: NodeJS.Platform }): void => {
      platformStage.setupPlatform({ value: platform });
      // Mirrors the responder's own platform ternary so the exec mock is described with the
      // exact command that platform produces.
      const cmd =
        platform === 'darwin'
          ? `open ${SERVER_URL}`
          : platform === 'win32'
            ? `start ${SERVER_URL}`
            : `xdg-open ${SERVER_URL}`;
      execProxy.setupSuccess({ command: cmd });
    },

    getStdoutOutput: (): readonly unknown[] => stdout.getWrites(),

    getBrowserOpenCalls: ({
      command,
    }: {
      command: string | ((command: unknown) => boolean);
    }): readonly unknown[][] => execProxy.getCallsFor({ command }),
  };
};
