import { access } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAccessAdapterProxy = (): {
  resolves: (params: { filePath: FilePath }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: access });

  return {
    resolves: ({ filePath }: { filePath: FilePath }) => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }) => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
