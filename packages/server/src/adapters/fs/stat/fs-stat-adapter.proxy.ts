import { stat } from 'fs/promises';
import type { Stats } from 'fs';

jest.mock('fs/promises');

export const fsStatAdapterProxy = (): {
  returns: (params: { stats: Partial<Stats> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mockStat = jest.mocked(stat);

  mockStat.mockResolvedValue({} as Stats);

  return {
    returns: ({ stats }: { stats: Partial<Stats> }): void => {
      mockStat.mockResolvedValueOnce(stats as Stats);
    },
    throws: ({ error }: { error: Error }): void => {
      mockStat.mockRejectedValueOnce(error);
    },
  };
};
