import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import type { Stats } from 'fs';

jest.mock('../../../adapters/fs/stat/fs-stat-adapter');

export const sessionIsNewBrokerProxy = (): {
  setupFileExists: (params: { size: number }) => void;
  setupFileNotFound: () => void;
} => {
  const mockFsStatAdapter = jest.mocked(fsStatAdapter);

  return {
    setupFileExists: ({ size }: { size: number }): void => {
      mockFsStatAdapter.mockResolvedValueOnce({ size } as Stats);
    },
    setupFileNotFound: (): void => {
      mockFsStatAdapter.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    },
  };
};
