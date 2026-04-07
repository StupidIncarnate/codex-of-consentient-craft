import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

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
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupWithMainBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: 'abc123\n' }),
        stderr: emptyMessage,
      });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: diffOutput }),
        stderr: emptyMessage,
      });
    },

    setupWithMasterBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMasterExists();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: 'abc123\n' }),
        stderr: emptyMessage,
      });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: diffOutput }),
        stderr: emptyMessage,
      });
    },

    setupMergeBaseFails: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: ErrorMessageStub({ value: 'fatal' }),
      });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: diffOutput }),
        stderr: emptyMessage,
      });
    },

    setupNoBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupNeitherExists();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: diffOutput }),
        stderr: emptyMessage,
      });
    },
  };
};
