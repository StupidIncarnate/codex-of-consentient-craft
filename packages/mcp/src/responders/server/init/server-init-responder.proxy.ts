/**
 * PURPOSE: Test setup helper for server init responder
 *
 * USAGE:
 * const proxy = ServerInitResponderProxy();
 * await proxy.callResponder();
 */

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { discoverIgnoreInitBrokerProxy } from '../../../brokers/discover-ignore/init/discover-ignore-init-broker.proxy';
import { folderConstraintsInitBrokerProxy } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker.proxy';
import { discoverIgnoreStateProxy } from '../../../state/discover-ignore/discover-ignore-state.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { ServerInitResponder } from './server-init-responder';

export const ServerInitResponderProxy = (): {
  callResponder: typeof ServerInitResponder;
  setupCwd: (params: { value: string }) => void;
  setupGitignore: (params: { contents: string }) => void;
  setupNoGitignore: () => void;
  setupGitignoreFoundInParent: (params: {
    startPath: string;
    gitignoreDir: string;
    contents: string;
  }) => void;
} => {
  const cwdGateway = cwdProxy();
  folderConstraintsInitBrokerProxy();
  const ignoreProxy = discoverIgnoreInitBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();
  const ignoreStateProxy = discoverIgnoreStateProxy();
  ignoreStateProxy.setupClear();

  return {
    callResponder: ServerInitResponder,
    setupCwd: ({ value }: { value: string }): void => {
      cwdGateway.setupCwd({ value });
    },
    setupGitignore: ({ contents }: { contents: string }): void => {
      cwdGateway.setupCwd({ value: '.' });
      ignoreProxy.setupGitignore({ contents });
    },
    setupNoGitignore: (): void => {
      cwdGateway.setupCwd({ value: '.' });
      ignoreProxy.setupNoGitignore();
    },
    setupGitignoreFoundInParent: ({
      startPath,
      gitignoreDir,
      contents,
    }: {
      startPath: string;
      gitignoreDir: string;
      contents: string;
    }): void => {
      cwdGateway.setupCwd({ value: startPath });
      ignoreProxy.setupGitignoreFoundInParent({ startPath, gitignoreDir, contents });
    },
  };
};
