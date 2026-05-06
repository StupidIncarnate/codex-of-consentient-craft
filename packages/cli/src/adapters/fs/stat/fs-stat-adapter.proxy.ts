import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsStatAdapterProxy = (): {
  returnsMtime: ({ mtimeMs }: { mtimeMs: number }) => void;
  returnsNull: () => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: stat });

  handle.mockResolvedValue(null);

  return {
    returnsMtime: ({ mtimeMs }: { mtimeMs: number }): void => {
      handle.mockResolvedValueOnce({ mtimeMs } as unknown as Stats);
    },
    returnsNull: (): void => {
      const error = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
      handle.mockRejectedValueOnce(error);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
