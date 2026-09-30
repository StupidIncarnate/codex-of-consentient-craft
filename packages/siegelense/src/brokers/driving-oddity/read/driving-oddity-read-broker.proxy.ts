import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import type { DrivingOddityStub } from '../../../contracts/driving-oddity/driving-oddity.stub';

type DrivingOddity = ReturnType<typeof DrivingOddityStub>;

const FILE_SIZE_BYTES = 128;
const FILE_MODIFIED_AT_MS = 1735689600000;

export const drivingOddityReadBrokerProxy = (): {
  setupNoFile: (params: { filePath: string }) => void;
  setupFile: (params: { filePath: string; entries: readonly DrivingOddity[] }) => void;
  setupRawFile: (params: { filePath: string; contents: string }) => void;
} => {
  const statProxy = statIfExistsProxy();
  const readFileMock = readFileProxy();

  return {
    setupNoFile: ({ filePath }: { filePath: string }): void => {
      statProxy.missing({ path: filePath });
    },

    setupFile: ({
      filePath,
      entries,
    }: {
      filePath: string;
      entries: readonly DrivingOddity[];
    }): void => {
      statProxy.returnsFile({
        path: filePath,
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
    setupRawFile: ({ filePath, contents }: { filePath: string; contents: string }): void => {
      statProxy.returnsFile({
        path: filePath,
        sizeBytes: FILE_SIZE_BYTES,
        modifiedAtMs: FILE_MODIFIED_AT_MS,
      });
      readFileMock.returns({ path: filePath, contents });
    },
  };
};
