/**
 * PURPOSE: Proxy for fsMkdirAdapter that mocks fs/promises mkdir
 *
 * USAGE:
 * const proxy = fsMkdirAdapterProxy();
 * proxy.succeeds({ filepath });
 */

import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: FilePath }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
  getCreatedDirs: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: mkdir });

  // Default: any unaddressed call succeeds. Kept (not removed) because
  // chat-subagent-tail-broker.proxy.ts (packages/orchestrator) composes this adapter proxy
  // bare, with no per-call staging, and documents that it relies on this default.
  handle.calledWith([]).resolves({ success: true as const });

  return {
    succeeds: ({ filepath }: { filepath: FilePath }): void => {
      handle.calledWith([filepath]).resolves({ success: true as const });
    },
    throws: ({ filepath, error }: { filepath: FilePath; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
    getCreatedDirs: (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]),
  };
};
