import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { setExitCodeProxy } from '#gateway/node/process/set-exit-code/set-exit-code.proxy';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { scanRunBrokerProxy } from '../../../brokers/scan/run/scan-run-broker.proxy';
import { WardScanResponder } from './ward-scan-responder';

export const WardScanResponderProxy = (): {
  callResponder: typeof WardScanResponder;
  setupWorkspaces: (params: { dirs: string[]; packageNames: string[] }) => void;
  setupPackageExit: (params: {
    projectFolder: ProjectFolder;
    exitCode: number;
    stdout: string;
  }) => void;
  getStdoutText: () => ReturnType<ReturnType<typeof stdoutProxy>['getWrittenText']>;
  getStderrText: () => ReturnType<ReturnType<typeof stderrProxy>['getWrittenText']>;
} => {
  const stdout = stdoutProxy();
  const stderr = stderrProxy();
  setExitCodeProxy();
  const scanProxy = scanRunBrokerProxy();

  return {
    callResponder: WardScanResponder,

    setupWorkspaces: ({ dirs, packageNames }): void => {
      scanProxy.setupWorkspaces({ dirs, packageNames });
    },

    setupPackageExit: ({ projectFolder, exitCode, stdout: eslintStdout }): void => {
      scanProxy.setupPackageExit({ projectFolder, exitCode, stdout: eslintStdout });
    },

    getStdoutText: (): ReturnType<ReturnType<typeof stdoutProxy>['getWrittenText']> =>
      stdout.getWrittenText(),

    getStderrText: (): ReturnType<ReturnType<typeof stderrProxy>['getWrittenText']> =>
      stderr.getWrittenText(),
  };
};
