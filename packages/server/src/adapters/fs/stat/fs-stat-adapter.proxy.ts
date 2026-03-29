import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Stats } from 'fs';

export const fsStatAdapterProxy = (): {
  returns: (params: { stats: Partial<Stats> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: stat });

  mock.mockResolvedValue({} as Stats);

  return {
    returns: ({ stats }: { stats: Partial<Stats> }): void => {
      mock.mockResolvedValueOnce(stats as Stats);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
