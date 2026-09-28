import { join } from '#gateway/node/path';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
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
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  const writtenPaths: FilePath[] = [];

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
      readProxy.returns({ path: packageJsonPath, contents });
      writeProxy.succeeds({ path: packageJsonPath });
      writtenPaths.push(packageJsonPath);
    },

    setupRootPackageJsonMissing: ({ projectRoot }: { projectRoot: FilePath }): void => {
      const packageJsonPath = filePathContract.parse(join(projectRoot, 'package.json'));
      readProxy.missing({ path: packageJsonPath });
    },

    getWrittenContents: (): readonly unknown[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [content];
      }),
  };
};
