import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Stats } from 'fs';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsStatAdapterProxy = (): {
  returns: (params: { filePath: FilePath; stats: Partial<Stats> }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: stat });

  return {
    returns: ({ filePath, stats }: { filePath: FilePath; stats: Partial<Stats> }): void => {
      mock.calledWith([filePath]).resolves(stats as Stats);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
