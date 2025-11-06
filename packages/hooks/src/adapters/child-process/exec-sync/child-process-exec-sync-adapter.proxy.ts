import type { ExecSyncOptions } from 'child_process';
import type { Buffer } from 'node:buffer';

export const childProcessExecSyncAdapterProxy = jest.fn<
  string | Buffer,
  [{ command: string; options?: ExecSyncOptions }]
>();

jest.mock('./child-process-exec-sync-adapter', () => ({
  childProcessExecSyncAdapter: childProcessExecSyncAdapterProxy,
}));
