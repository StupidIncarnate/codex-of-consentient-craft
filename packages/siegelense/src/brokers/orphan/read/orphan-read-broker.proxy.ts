import type { FsError } from '#gateway/node/fs';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { join } from '#gateway/node/path';
import { isNativeErrorProxy } from '#gateway/node/util__types/is-native-error/is-native-error.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

const PROC_ROOT = AbsoluteFilePathStub({ value: '/proc' });

export const orphanReadBrokerProxy = (): {
  setupProcListing: (params: { pids: readonly string[] }) => void;
  setupPidStat: (params: { pid: string; pgrp: number; comm?: string }) => void;
  setupPidStatVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
  setupPidStatFails: (params: { pid: string; error: Error }) => void;
  setupCmdline: (params: { pid: string; argv: readonly string[] }) => void;
  setupCmdlineVanished: (params: { pid: string; code?: 'ENOENT' | 'ESRCH' }) => void;
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupGone: (params: { pgid: ProcessGroupId }) => void;
} => {
  isNativeErrorProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports. Joining '/proc', a pid and a leaf name needs no substitution to compute a
  // real path, so only the sticky real-passthrough default is installed.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const readdirProxy = readdirIfExistsProxy();
  const readFileProxy = readFileIfExistsProxy();
  const aliveProxy = processIsAliveBrokerProxy();

  return {
    setupProcListing: ({ pids }: { pids: readonly string[] }): void => {
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

    // Two codes, one meaning: ENOENT when the directory was already gone before the read opened
    // it, ESRCH when the process exited between that open succeeding and the read completing.
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

    // Real /proc/<pid>/cmdline separates argv entries with NUL bytes, trailing one included —
    // never spaces. A fixture built with spaces would agree with the space-splitting bug instead
    // of catching it.
    setupCmdline: ({ pid, argv }: { pid: string; argv: readonly string[] }): void => {
      readFileProxy.returns({
        path: `/proc/${pid}/cmdline`,
        contents: `${argv.join(String.fromCharCode(0))}${String.fromCharCode(0)}`,
      });
    },

    setupCmdlineVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      if (code === 'ENOENT') {
        readFileProxy.missing({ path: `/proc/${pid}/cmdline` });
      } else {
        readFileProxy.throwsMatchingPath({
          path: `/proc/${pid}/cmdline`,
          error: Object.assign(new Error(`${code}: process vanished mid-read`), {
            code,
          }) as FsError,
        });
      }
    },

    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
    },

    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },
  };
};
