import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteScriptsResponder } from './install-write-scripts-responder';

export const InstallWriteScriptsResponderProxy = (): {
  callResponder: typeof InstallWriteScriptsResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  setupReadFileContent: (params: { filePath: FilePath; content: string }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getWrittenPath: () => unknown;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  // Every test in this file targets targetProjectRoot '/project', so the resolved package.json
  // path is the same for every scenario.
  const packageJsonPath = FilePathStub({ value: '/project/package.json' });

  return {
    callResponder: InstallWriteScriptsResponder,

    setupFileExists: (): void => {
      existsProxy.returns({ filePath: packageJsonPath, result: true });
    },

    setupFileNotExists: (): void => {
      existsProxy.returns({ filePath: packageJsonPath, result: false });
    },

    setupReadFileContent: ({
      filePath,
      content,
    }: {
      filePath: FilePath;
      content: string;
    }): void => {
      readProxy.returns({ filePath, content });
      writeProxy.succeeds({ filePath });
    },

    getWrittenContent: ({ filePath }: { filePath: FilePath }): unknown =>
      writeProxy.getWrittenContent({ filePath }),

    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
