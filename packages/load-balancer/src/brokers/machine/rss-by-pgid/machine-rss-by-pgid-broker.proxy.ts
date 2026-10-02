import type { FsError } from '#gateway/node/fs';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { join } from '#gateway/node/path';
import { isNativeErrorProxy } from '#gateway/node/util__types/is-native-error/is-native-error.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

const PROC_ROOT = '/proc';

export const machineRssByPgidBrokerProxy = (): {
  setupProcMissing: () => void;
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
  setupPidStatFails: (params: { pid: string; error: Error }) => void;
  setupPidStatm: (params: { pid: string; residentPages: number }) => void;
  setupPidStatmVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
} => {
  isNativeErrorProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const statProxy = statIfExistsProxy();
  const readdirProxy = readdirIfExistsProxy();
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupProcMissing: (): void => {
      statProxy.missing({ path: PROC_ROOT });
    },

    setupProcListing: ({ pids }: { pids: readonly string[] }): void => {
      statProxy.returnsFile({ path: PROC_ROOT, sizeBytes: 0, modifiedAtMs: 0 });
      readdirProxy.returns({
        path: PROC_ROOT,
        names: [...pids, 'vmstat', 'self', 'uptime'],
      });
    },

    setupPidStat: ({ pid, pgrp, comm }: { pid: string; pgrp: number; comm?: string }): void => {
      readFileProxy.returns({
        path: `/proc/${pid}/stat`,
        contents: `${pid} (${comm ?? 'node'}) S 1 ${pgrp} ${pgrp} 0 -1 4194304 0 0 0 0`,
      });
    },

    setupPidStatVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      if (code === 'ENOENT') {
        readFileProxy.missing({ path: `/proc/${pid}/stat` });
      } else {
        readFileProxy.throwsMatchingPath({
          path: `/proc/${pid}/stat`,
          error: Object.assign(new Error(`${code}: process vanished mid-read`), {
            code,
          }) as FsError,
        });
      }
    },

    setupPidStatFails: ({ pid, error }: { pid: string; error: Error }): void => {
      readFileProxy.throwsMatchingPath({
        path: `/proc/${pid}/stat`,
        error: error as FsError,
      });
    },

    setupPidStatm: ({ pid, residentPages }: { pid: string; residentPages: number }): void => {
      readFileProxy.returns({
        path: `/proc/${pid}/statm`,
        contents: `1000 ${residentPages} 500 100 0 800 0`,
      });
    },

    setupPidStatmVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      if (code === 'ENOENT') {
        readFileProxy.missing({ path: `/proc/${pid}/statm` });
      } else {
        readFileProxy.throwsMatchingPath({
          path: `/proc/${pid}/statm`,
          error: Object.assign(new Error(`${code}: process vanished mid-read`), {
            code,
          }) as FsError,
        });
      }
    },
  };
};
