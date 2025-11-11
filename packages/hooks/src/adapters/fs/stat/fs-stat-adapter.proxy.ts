jest.mock('fs/promises');

import { stat } from 'fs/promises';
import type { Stats } from 'node:fs';
import { FileStatsStub } from '../../../contracts/file-stats/file-stats.stub';
import type { FileStats } from '../../../contracts/file-stats/file-stats-contract';

export const fsStatAdapterProxy = (): {
  returns: ({ stats }: { stats: FileStats }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = jest.mocked(stat);

  const defaultStats = FileStatsStub();
  mock.mockResolvedValue(defaultStats as unknown as Stats);

  return {
    returns: ({ stats }: { stats: FileStats }) => {
      mock.mockResolvedValueOnce(stats as unknown as Stats);
    },
    throws: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
