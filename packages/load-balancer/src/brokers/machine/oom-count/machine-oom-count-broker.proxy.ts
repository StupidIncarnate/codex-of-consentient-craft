import type { FsError } from '#gateway/node/fs';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

const VMSTAT_PATH = '/proc/vmstat';

export const machineOomCountBrokerProxy = (): {
  setupVmstat: (params: { content: string }) => void;
  setupVmstatMissing: () => void;
  setupVmstatReadFails: (params: { error: FsError }) => void;
} => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const readFileMock = readFileIfExistsProxy();

  return {
    setupVmstat: ({ content }: { content: string }): void => {
      readFileMock.returns({ path: VMSTAT_PATH, contents: content });
    },

    setupVmstatMissing: (): void => {
      readFileMock.missing({ path: VMSTAT_PATH });
    },

    setupVmstatReadFails: ({ error }: { error: FsError }): void => {
      readFileMock.throwsMatchingPath({ path: VMSTAT_PATH, error });
    },
  };
};
