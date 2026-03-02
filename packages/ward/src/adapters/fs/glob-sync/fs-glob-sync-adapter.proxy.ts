import { globSync } from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  globSync: jest.fn(),
}));

export const fsGlobSyncAdapterProxy = (): {
  returnsCount: (params: { count: number }) => void;
  returnsFiles: (params: { files: string[] }) => void;
  returnsEmpty: () => void;
} => {
  const mock = jest.mocked(globSync);

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
