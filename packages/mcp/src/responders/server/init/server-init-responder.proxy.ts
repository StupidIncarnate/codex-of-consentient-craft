/**
 * PURPOSE: Test setup helper for server init responder
 *
 * USAGE:
 * const proxy = ServerInitResponderProxy();
 * await proxy.callResponder();
 */

import type { FileContents } from '@dungeonmaster/shared/contracts';
import { discoverIgnoreInitBrokerProxy } from '../../../brokers/discover-ignore/init/discover-ignore-init-broker.proxy';
import { folderConstraintsInitBrokerProxy } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker.proxy';
import { discoverIgnoreStateProxy } from '../../../state/discover-ignore/discover-ignore-state.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { ServerInitResponder } from './server-init-responder';

export const ServerInitResponderProxy = (): {
  callResponder: typeof ServerInitResponder;
  setupGitignore: (params: { contents: FileContents }) => void;
  setupNoGitignore: () => void;
} => {
  folderConstraintsInitBrokerProxy();
  const ignoreProxy = discoverIgnoreInitBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();
  const ignoreStateProxy = discoverIgnoreStateProxy();
  ignoreStateProxy.setupClear();

  return {
    callResponder: ServerInitResponder,
    setupGitignore: ({ contents }: { contents: FileContents }): void => {
      ignoreProxy.setupGitignore({ contents });
    },
    setupNoGitignore: (): void => {
      ignoreProxy.setupNoGitignore();
    },
  };
};
