import { portResolveBrokerProxy } from '@dungeonmaster/shared/brokers/port/resolve/port-resolve-broker.proxy';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { moduleResolveBrokerProxy } from '@dungeonmaster/shared/brokers/module/resolve/module-resolve-broker.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { getPlatformProxy } from '#gateway/node/process/get-platform/get-platform.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { runFireAndForgetProxy } from '#gateway/node/child_process/run-fire-and-forget/run-fire-and-forget.proxy';
import { httpBackendPackageResolveBrokerProxy } from '../../../brokers/http-backend-package/resolve/http-backend-package-resolve-broker.proxy';
import { CliServeResponder } from './cli-serve-responder';

const PORT = '3737';
const SERVER_URL = `http://${environmentStatics.hostname}:${PORT}`;
const SERVER_PACKAGE_NAME = '@dungeonmaster/server';
const USER_CWD = '/repo/consumer';
const SERVER_PATH = `${USER_CWD}/node_modules/${SERVER_PACKAGE_NAME}/dist/src/index.js`;

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

  // The responder asks httpBackendPackageResolveBroker for the package name, which runs real with
  // only its own gateway boundaries staged. The server module then resolves from the user's cwd,
  // staged here, and the dynamic import is staged against that resolved path.
  const backendResolveProxy = httpBackendPackageResolveBrokerProxy();
  backendResolveProxy.setupOwnDependencies({ dependencyNames: [SERVER_PACKAGE_NAME] });
  backendResolveProxy.setupCandidateHono({ candidateName: SERVER_PACKAGE_NAME });

  const cwdStage = cwdProxy();
  const moduleStage = moduleResolveBrokerProxy();
  const importProxy = dynamicImportProxy();
  importProxy.returns({ path: SERVER_PATH, module: { StartServer } });
  const portProxy = portResolveBrokerProxy();
  portProxy.setEnvPort({ value: PORT });

  const platformStage = getPlatformProxy();
  const stdout = stdoutProxy();

  return {
    callResponder: CliServeResponder,

    setupPlatform: ({ platform }: { platform: NodeJS.Platform }): void => {
      cwdStage.setupCwd({ value: USER_CWD });
      moduleStage.setupResolvesFromRunRoot({
        specifier: SERVER_PACKAGE_NAME,
        repoRoot: USER_CWD,
        path: SERVER_PATH,
      });
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
