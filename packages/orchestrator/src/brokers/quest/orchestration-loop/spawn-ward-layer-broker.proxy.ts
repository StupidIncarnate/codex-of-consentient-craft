import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const spawnWardLayerBrokerProxy = (): {
  setupWardSuccess: (params: { exitCode: ExitCode; wardResultJson: string }) => void;
  setupWardFailure: (params: { exitCode: ExitCode; wardResultJson: string }) => void;
  setupWardNoRunId: (params: { exitCode: ExitCode }) => void;
  setupWardKilled: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const fileProxy = fsReadFileAdapterProxy();

  return {
    setupWardSuccess: ({
      exitCode,
      wardResultJson,
    }: {
      exitCode: ExitCode;
      wardResultJson: string;
    }): void => {
      captureProxy.setupSuccess({
        exitCode,
        stdout: 'run: 1739625600000-a3f1\nlint:      PASS',
        stderr: '',
      });
      fileProxy.resolves({ content: wardResultJson });
    },

    setupWardFailure: ({
      exitCode,
      wardResultJson,
    }: {
      exitCode: ExitCode;
      wardResultJson: string;
    }): void => {
      captureProxy.setupSuccess({
        exitCode,
        stdout: 'run: 1739625600000-a3f1\nlint:      FAIL',
        stderr: '',
      });
      fileProxy.resolves({ content: wardResultJson });
    },

    setupWardNoRunId: ({ exitCode }: { exitCode: ExitCode }): void => {
      captureProxy.setupSuccess({ exitCode, stdout: 'some error without run id', stderr: '' });
    },

    setupWardKilled: (): void => {
      captureProxy.setupError({ error: new Error('Process was killed') });
    },
  };
};
