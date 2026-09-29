import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type { FsError } from '#gateway/node/fs';

const VMSTAT_PATH = AbsoluteFilePathStub({ value: '/proc/vmstat' });

export const machineOomCountBrokerProxy = (): {
  setupVmstat: (params: { content: string }) => void;
  setupVmstatMissing: () => void;
  setupVmstatReadFails: (params: { error: FsError }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports. '/proc' + 'vmstat' needs no substitution to compute VMSTAT_PATH's real
  // value, so only the sticky real-passthrough default is installed — no per-call queueing needed
  // any more, unlike the shared `pathJoinAdapter` queue this used to ride.
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
