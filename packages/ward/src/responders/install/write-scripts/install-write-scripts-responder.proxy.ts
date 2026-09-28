import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { InstallWriteScriptsResponder } from './install-write-scripts-responder';

export const InstallWriteScriptsResponderProxy = (): {
  callResponder: typeof InstallWriteScriptsResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  setupReadFileContent: (params: { filePath: FilePath; content: string }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getWrittenPath: () => unknown;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();

  // Every test in this file targets targetProjectRoot '/project', so the resolved package.json
  // path is the same for every scenario.
  const packageJsonPath = FilePathStub({ value: '/project/package.json' });

  return {
    callResponder: InstallWriteScriptsResponder,

    setupFileExists: (): void => {
      existsProxy.returns({ path: packageJsonPath, exists: true });
    },

    setupFileNotExists: (): void => {
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },

    setupReadFileContent: ({
      filePath,
      content,
    }: {
      filePath: FilePath;
      content: string;
    }): void => {
      readProxy.returns({ path: filePath, contents: content });
      writeProxy.succeeds({ path: filePath });
    },

    getWrittenContent: ({ filePath }: { filePath: FilePath }): unknown =>
      writeProxy.writtenContentsFor({ path: filePath }),

    // Trivial echo of the known address — the write having actually landed there is proven by
    // getWrittenContent returning a value; a caller that only wants the path back doesn't need
    // to re-derive it (matches quest-persist-broker.proxy.ts's same idiom).
    getWrittenPath: (): unknown => packageJsonPath,
  };
};
