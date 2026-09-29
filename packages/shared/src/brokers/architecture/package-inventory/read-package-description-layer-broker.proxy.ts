import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const anyPath = (value: unknown): boolean => typeof value === 'string';

export const readPackageDescriptionLayerBrokerProxy = (): {
  setupDescription: ({
    packageJsonPath,
    description,
  }: {
    packageJsonPath: AbsoluteFilePath;
    description: ContentText;
  }) => void;
  setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const gatewayProxy = readFileSyncProxy();
  const handle = registerMock({ fn: readFileSync });

  return {
    setupDescription: ({
      packageJsonPath,
      description,
    }: {
      packageJsonPath: AbsoluteFilePath;
      description: ContentText;
    }): void => {
      gatewayProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ description }),
      });
    },

    setupNoPackageJson: ({ packageJsonPath }: { packageJsonPath: AbsoluteFilePath }): void => {
      gatewayProxy.throws({
        path: packageJsonPath,
        error: FileMissingErrorStub({ path: packageJsonPath }),
      });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      handle.calledWith([anyPath]).implement(fn as never);
    },
  };
};
