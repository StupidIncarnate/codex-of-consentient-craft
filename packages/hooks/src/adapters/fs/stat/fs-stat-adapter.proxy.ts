import { stat } from 'fs/promises';
import type { Stats } from 'node:fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileStats } from '../../../contracts/file-stats/file-stats-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsStatAdapterProxy = (): {
  returns: ({ filePath, stats }: { filePath: FilePath; stats: FileStats }) => void;
  throws: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: stat });

  return {
    returns: ({ filePath, stats }: { filePath: FilePath; stats: FileStats }): void => {
      mock.calledWith([filePath]).resolves(stats as unknown as Stats);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
