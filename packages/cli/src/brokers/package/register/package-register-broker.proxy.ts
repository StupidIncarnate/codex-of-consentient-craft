import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { packageRegisterBroker } from './package-register-broker';

export const packageRegisterBrokerProxy = (): {
  callBroker: typeof packageRegisterBroker;
  setupRootPackageJson: (params: { projectRoot: FilePath; contents: string }) => void;
  setupRootPackageJsonMissing: (params: { projectRoot: FilePath }) => void;
  getWrittenContents: () => readonly unknown[];
} => {
  // Unstaged: pathJoinAdapterProxy's default is a real path.join passthrough, and every
  // packageJsonPath computed below is the real join of projectRoot + 'package.json' — there is
  // nothing to fake, so read/write are the only mocks keyed here, addressed by those real paths.
  pathJoinAdapterProxy();
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
      const packageJsonPath = pathJoinAdapter({ paths: [projectRoot, 'package.json'] });
      readProxy.resolves({ filePath: packageJsonPath, content: contents });
      writeProxy.succeeds({ filePath: packageJsonPath });
    },

    setupRootPackageJsonMissing: ({ projectRoot }: { projectRoot: FilePath }): void => {
      const packageJsonPath = pathJoinAdapter({ paths: [projectRoot, 'package.json'] });
      readProxy.rejects({
        filePath: packageJsonPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    getWrittenContents: (): readonly unknown[] =>
      writeProxy.getAllWrittenFiles().map((file) => file.content),
  };
};
