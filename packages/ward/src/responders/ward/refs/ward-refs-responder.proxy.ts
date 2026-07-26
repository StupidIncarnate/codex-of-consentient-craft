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
  stdoutSpy.calledWith([]).returns(true);
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);

  return {
    callResponder: WardRefsResponder,

    setupSingleEligibleInSync: (): void => {
      workspaceProxy.setupMultiPackage({
        patterns: ['packages/*'],
        dirs: ['shared'],
        packageNames: ['@dm/shared'],
      });
      // "Already in sync" means the tsconfig read (shared by both the eligibility scan and the
      // sync-pair comparison) already carries the references the broker would otherwise write.
      syncProxy.setupWorkspace({
        folderPath: '/project/packages/shared',
        tsconfigJson: '{"compilerOptions":{"composite":true},"references":[]}',
        packageJson: '{"name":"@dm/shared","dependencies":{}}',
      });
      syncProxy.setupRootTsconfig({
        rootPath: '/project',
        tsconfigJson: '{"references":[{"path":"packages/shared"}]}',
      });
    },

    setupNoWorkspaces: (): void => {
      workspaceProxy.setupSinglePackage();
    },

    getStdoutCalls: (): unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),
    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),
  };
};
