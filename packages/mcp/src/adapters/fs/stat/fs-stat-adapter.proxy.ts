import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsStatAdapterProxy = (): {
  returns: (params: { stats: Partial<Stats> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: stat });

  handle.mockResolvedValue({} as Stats);

  return {
    returns: ({ stats }: { stats: Partial<Stats> }): void => {
      handle.mockResolvedValueOnce(stats as Stats);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
