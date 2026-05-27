import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { workspaceDiscoverBrokerProxy } from '../../../brokers/workspace/discover/workspace-discover-broker.proxy';
import { projectReferencesSyncBrokerProxy } from '../../../brokers/project-references/sync/project-references-sync-broker.proxy';
import { WardRefsResponder } from './ward-refs-responder';

export const WardRefsResponderProxy = (): {
  callResponder: typeof WardRefsResponder;
  setupSingleEligibleInSync: () => void;
  setupNoWorkspaces: () => void;
  getStdoutCalls: () => unknown[];
  getStderrCalls: () => unknown[];
} => {
  const workspaceProxy = workspaceDiscoverBrokerProxy();
  const syncProxy = projectReferencesSyncBrokerProxy();

  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.mockImplementation(() => true);
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);

  return {
    callResponder: WardRefsResponder,

    setupSingleEligibleInSync: (): void => {
      workspaceProxy.setupMultiPackage({
        patterns: ['packages/*'],
        dirs: ['shared'],
        packageNames: ['@dm/shared'],
      });
      syncProxy.setupWorkspace({
        tsconfigJson: '{"compilerOptions":{"composite":true}}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
        pairTsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
      });
      syncProxy.flushPairReads();
      syncProxy.setupRootTsconfig({
        tsconfigJson: '{"references":[{"path":"packages/shared"}]}',
      });
    },

    setupNoWorkspaces: (): void => {
      workspaceProxy.setupSinglePackage();
    },

    getStdoutCalls: (): unknown[] => stdoutSpy.mock.calls.map((call) => call[0]),
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
  };
};
