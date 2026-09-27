import { join } from '#gateway/node/path';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { packageRegisterBroker } from './package-register-broker';

export const packageRegisterBrokerProxy = (): {
  callBroker: typeof packageRegisterBroker;
  setupRootPackageJson: (params: { projectRoot: FilePath; contents: string }) => void;
  setupRootPackageJsonMissing: (params: { projectRoot: FilePath }) => void;
  getWrittenContents: () => readonly unknown[];
} => {
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callBroker: packageRegisterBroker,

    setupRootPackageJson: ({
      projectRoot,
      contents,
    }: {
      projectRoot: FilePath;
      contents: string;
    }): void => {
      const packageJsonPath = filePathContract.parse(join(projectRoot, 'package.json'));
      readProxy.resolves({ filePath: packageJsonPath, content: contents });
      writeProxy.succeeds({ filePath: packageJsonPath });
    },

    setupRootPackageJsonMissing: ({ projectRoot }: { projectRoot: FilePath }): void => {
      const packageJsonPath = filePathContract.parse(join(projectRoot, 'package.json'));
      readProxy.rejects({
        filePath: packageJsonPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    getWrittenContents: (): readonly unknown[] =>
      writeProxy.getAllWrittenFiles().map((file) => file.content),
  };
};
