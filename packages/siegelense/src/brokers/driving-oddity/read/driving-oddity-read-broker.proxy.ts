import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import type { DrivingOddityStub } from '../../../contracts/driving-oddity/driving-oddity.stub';

type DrivingOddity = ReturnType<typeof DrivingOddityStub>;

const FILE_SIZE_BYTES = 128;
const FILE_MODIFIED_AT_MS = 1735689600000;

export const drivingOddityReadBrokerProxy = (): {
  setupNoFile: (params: { filePath: AbsoluteFilePath }) => void;
  setupFile: (params: { filePath: AbsoluteFilePath; entries: readonly DrivingOddity[] }) => void;
  setupRawFile: (params: { filePath: AbsoluteFilePath; contents: string }) => void;
} => {
  const statProxy = fsStatAdapterProxy();
  const readFileMock = readFileProxy();

  return {
    // ENOENT is what fs.stat really raises for an absent file, and fsStatAdapter turns exactly that
    // code into a null — staging a generic Error here would make the adapter rethrow instead.
    setupNoFile: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupFile: ({
      filePath,
      entries,
    }: {
      filePath: AbsoluteFilePath;
      entries: readonly DrivingOddity[];
    }): void => {
      statProxy.resolves({
        filePath,
        sizeBytes: FILE_SIZE_BYTES,
        modifiedAtMs: FILE_MODIFIED_AT_MS,
      });
      readFileMock.returns({
        path: filePath,
        contents: `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
      });
    },

    // The same staging as setupFile, but with the file body written by hand — for the malformed-line
    // case, which no array of valid entries can express.
    setupRawFile: ({
      filePath,
      contents,
    }: {
      filePath: AbsoluteFilePath;
      contents: string;
    }): void => {
      statProxy.resolves({
        filePath,
        sizeBytes: FILE_SIZE_BYTES,
        modifiedAtMs: FILE_MODIFIED_AT_MS,
      });
      readFileMock.returns({ path: filePath, contents });
    },
  };
};
