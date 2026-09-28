import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

const PROC_ROOT = AbsoluteFilePathStub({ value: '/proc' });

export const machineRssByPgidBrokerProxy = (): {
  setupProcMissing: () => void;
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
  setupPidStatFails: (params: { pid: string; error: Error }) => void;
  setupPidStatm: (params: { pid: string; residentPages: number }) => void;
  setupPidStatmVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports. Joining '/proc', a pid and a leaf name needs no substitution to compute a
  // real path, so only the sticky real-passthrough default is installed.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const statProxy = fsStatAdapterProxy();
  const readdirProxy = readdirIfExistsProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupProcMissing: (): void => {
      statProxy.rejects({
        filePath: PROC_ROOT,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupProcListing: ({ pids }: { pids: readonly string[] }): void => {
      statProxy.resolves({ filePath: PROC_ROOT, sizeBytes: 0, modifiedAtMs: 0 });
      readdirProxy.returns({
        path: PROC_ROOT,
        names: [...pids, 'vmstat', 'self', 'uptime'],
      });
    },

    setupPidStat: ({ pid, pgrp, comm }: { pid: string; pgrp: number; comm?: string }): void => {
      readFileProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/stat` }),
        content: `${pid} (${comm ?? 'node'}) S 1 ${pgrp} ${pgrp} 0 -1 4194304 0 0 0 0`,
      });
    },

    // Two codes, one meaning: ENOENT when the directory was already gone before the read opened
    // it, ESRCH when the process exited between that open succeeding and the read completing.
    setupPidStatVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      readFileProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/stat` }),
        error: Object.assign(new Error(`${code}: process vanished mid-read`), { code }),
      });
    },

    setupPidStatFails: ({ pid, error }: { pid: string; error: Error }): void => {
      readFileProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/stat` }),
        error,
      });
    },

    setupPidStatm: ({ pid, residentPages }: { pid: string; residentPages: number }): void => {
      readFileProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/statm` }),
        content: `1000 ${residentPages} 500 100 0 800 0`,
      });
    },

    setupPidStatmVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      readFileProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/statm` }),
        error: Object.assign(new Error(`${code}: process vanished mid-read`), { code }),
      });
    },
  };
};
