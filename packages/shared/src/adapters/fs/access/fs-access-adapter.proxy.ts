import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsAccessAdapterProxy = (): {
  resolves: (params: { filePath: FilePath }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: access });

  return {
    // No default: every shared caller (config-root-find, guild-path-walk-up,
    // tsconfig-path-find, project-root-find, the eslint/hook variant walkers) explicitly
    // stages access for every candidate path it checks, so a genuinely unstaged call is a
    // real bug, not a case that needs a quiet catch-all.
    resolves: ({ filePath }: { filePath: FilePath }): void => {
      handle.calledWith([filePath]).resolves({ success: true as const });
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
  };
};
