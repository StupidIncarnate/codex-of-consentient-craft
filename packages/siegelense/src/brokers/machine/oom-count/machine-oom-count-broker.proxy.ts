import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

const VMSTAT_PATH = AbsoluteFilePathStub({ value: '/proc/vmstat' });

export const machineOomCountBrokerProxy = (): {
  setupVmstat: (params: { content: string }) => void;
  setupVmstatMissing: () => void;
  setupVmstatReadFails: (params: { error: Error }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports. '/proc' + 'vmstat' needs no substitution to compute VMSTAT_PATH's real
  // value, so only the sticky real-passthrough default is installed — no per-call queueing needed
  // any more, unlike the shared `pathJoinAdapter` queue this used to ride.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupVmstat: ({ content }: { content: string }): void => {
      readFileProxy.resolves({ filePath: VMSTAT_PATH, content });
    },

    setupVmstatMissing: (): void => {
      readFileProxy.rejects({
        filePath: VMSTAT_PATH,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupVmstatReadFails: ({ error }: { error: Error }): void => {
      readFileProxy.rejects({ filePath: VMSTAT_PATH, error });
    },
  };
};
