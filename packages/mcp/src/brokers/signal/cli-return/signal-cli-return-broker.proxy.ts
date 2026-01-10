import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const signalCliReturnBrokerProxy = (): {
  setupSignalWrite: (params: { questsFolder: FilePath; signalPath: FilePath }) => void;
  setupWriteFails: (params: { error: Error }) => void;
  setupWriteAndCapture: () => () => FileContents;
} => {
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');

  const capturedContents: FileContents[] = [];

  return {
    setupSignalWrite: ({
      questsFolder,
      signalPath,
    }: {
      questsFolder: FilePath;
      signalPath: FilePath;
    }): void => {
      pathJoinProxy.returns({ paths: [], result: questsFolder });
      pathJoinProxy.returns({ paths: [], result: signalPath });
      writeFileProxy.succeeds({
        filepath: FilePathStub({ value: signalPath }),
        contents: FileContentsStub({ value: '' }),
      });
    },

    setupWriteFails: ({ error }: { error: Error }): void => {
      const questsFolder = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const signalPath = FilePathStub({ value: '/project/.dungeonmaster-quests/.cli-signal' });
      pathJoinProxy.returns({ paths: [], result: questsFolder });
      pathJoinProxy.returns({ paths: [], result: signalPath });
      writeFileProxy.throws({
        filepath: FilePathStub({ value: signalPath }),
        error,
      });
    },

    setupWriteAndCapture: (): (() => FileContents) => {
      const questsFolder = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const signalPath = FilePathStub({ value: '/project/.dungeonmaster-quests/.cli-signal' });
      pathJoinProxy.returns({ paths: [], result: questsFolder });
      pathJoinProxy.returns({ paths: [], result: signalPath });

      const { writeFile } = jest.requireMock<{
        writeFile: jest.Mock;
      }>('fs/promises');

      writeFile.mockImplementation((_path: FilePath, content: FileContents): void => {
        capturedContents.push(content);
      });

      return (): FileContents => {
        const lastContent = capturedContents[capturedContents.length - 1];
        if (lastContent === undefined) {
          throw new Error('No content captured - writeFile was not called');
        }
        return lastContent;
      };
    },
  };
};
