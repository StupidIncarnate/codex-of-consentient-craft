import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsStatAdapterProxy = (): {
  returnsMtime: (params: { filePath: FilePath; mtimeMs: number }) => void;
  returnsNull: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: stat });

  return {
    returnsMtime: ({ filePath, mtimeMs }: { filePath: FilePath; mtimeMs: number }): void => {
      handle.calledWith([filePath]).resolves({ mtimeMs } as unknown as Stats);
    },
    returnsNull: ({ filePath }: { filePath: FilePath }): void => {
      const error = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
      handle.calledWith([filePath]).rejects(error);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
  };
};
