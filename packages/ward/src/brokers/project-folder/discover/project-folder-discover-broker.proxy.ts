import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { projectFolderDiscoverLayerReadBrokerProxy } from './project-folder-discover-layer-read-broker.proxy';

export const projectFolderDiscoverBrokerProxy = (): {
  setupFindsPackages: (params: { gitOutput: string; packageContents: string[] }) => void;
  setupNoPackages: () => void;
  setupGitFails: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const layerProxy = projectFolderDiscoverLayerReadBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupFindsPackages: ({
      gitOutput,
      packageContents,
    }: {
      gitOutput: string;
      packageContents: string[];
    }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: gitOutput, stderr: '' });
      packageContents.forEach((content) => {
        layerProxy.setupReturnsContent({ content });
      });
    },

    setupNoPackages: (): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
    },

    setupGitFails: (): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout: '', stderr: 'fatal' });
    },
  };
};
