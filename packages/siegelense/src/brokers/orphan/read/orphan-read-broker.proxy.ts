import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
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
  errorIsNativeErrorAdapterProxy();
  // pathJoinAdapter has no override staged here — its default is a real path.join passthrough,
  // and joining '/proc', a pid and a leaf name needs no substitution to compute a real path.
  pathJoinAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const aliveProxy = processIsAliveAdapterProxy();

  return {
    setupProcListing: ({ pids }: { pids: readonly string[] }): void => {
      readdirProxy.resolves({
        dirPath: PROC_ROOT,
        entries: [...pids, 'vmstat', 'self', 'uptime'],
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

    // Real /proc/<pid>/cmdline separates argv entries with NUL bytes, trailing one included —
    // never spaces. A fixture built with spaces would agree with the space-splitting bug instead
    // of catching it.
    setupCmdline: ({ pid, argv }: { pid: string; argv: readonly string[] }): void => {
      readFileProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/cmdline` }),
        content: `${argv.join(String.fromCharCode(0))}${String.fromCharCode(0)}`,
      });
    },

    setupCmdlineVanished: ({
      pid,
      code = 'ENOENT',
    }: {
      pid: string;
      code?: 'ENOENT' | 'ESRCH';
    }): void => {
      readFileProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: `/proc/${pid}/cmdline` }),
        error: Object.assign(new Error(`${code}: process vanished mid-read`), { code }),
      });
    },

    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupAlive({ pgid });
    },

    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      aliveProxy.setupGone({ pgid });
    },
  };
};
