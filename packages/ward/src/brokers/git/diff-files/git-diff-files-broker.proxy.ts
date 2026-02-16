import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { gitDetectDefaultBranchBrokerProxy } from '../detect-default-branch/git-detect-default-branch-broker.proxy';

export const gitDiffFilesBrokerProxy = (): {
  setupWithMainBranch: (params: { diffOutput: string }) => void;
  setupWithMasterBranch: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: (params: { diffOutput: string }) => void;
  setupNoBranch: (params: { diffOutput: string }) => void;
} => {
  const detectProxy = gitDetectDefaultBranchBrokerProxy();
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupWithMainBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      captureProxy.setupSuccess({ exitCode: successCode, stdout: 'abc123\n', stderr: '' });
      captureProxy.setupSuccess({ exitCode: successCode, stdout: diffOutput, stderr: '' });
    },

    setupWithMasterBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMasterExists();
      captureProxy.setupSuccess({ exitCode: successCode, stdout: 'abc123\n', stderr: '' });
      captureProxy.setupSuccess({ exitCode: successCode, stdout: diffOutput, stderr: '' });
    },

    setupMergeBaseFails: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      captureProxy.setupSuccess({ exitCode: failCode, stdout: '', stderr: 'fatal' });
      captureProxy.setupSuccess({ exitCode: successCode, stdout: diffOutput, stderr: '' });
    },

    setupNoBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupNeitherExists();
      captureProxy.setupSuccess({ exitCode: successCode, stdout: diffOutput, stderr: '' });
    },
  };
};
