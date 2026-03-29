import { globSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsGlobSyncAdapterProxy = (): {
  returnsCount: (params: { count: number }) => void;
  returnsFiles: (params: { files: string[] }) => void;
  returnsEmpty: () => void;
} => {
  const mock = registerMock({ fn: globSync });

  mock.mockReturnValue(['discovered.ts']);

  return {
    returnsCount: ({ count }: { count: number }): void => {
      mock.mockReturnValueOnce(Array.from({ length: count }, (_, i) => `file-${String(i)}.ts`));
    },
    returnsFiles: ({ files }: { files: string[] }): void => {
      mock.mockReturnValueOnce(files);
    },
    returnsEmpty: (): void => {
      mock.mockReturnValue([]);
    },
  };
};
