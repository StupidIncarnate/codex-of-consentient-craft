import { globSync } from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  globSync: jest.fn(),
}));

export const fsGlobSyncAdapterProxy = (): {
  returnsCount: (params: { count: number }) => void;
  returnsEmpty: () => void;
} => {
  const mock = jest.mocked(globSync);

  mock.mockReturnValue(['discovered.ts']);

  return {
    returnsCount: ({ count }: { count: number }): void => {
      mock.mockReturnValueOnce(Array.from({ length: count }, (_, i) => `file-${String(i)}.ts`));
    },
    returnsEmpty: (): void => {
      mock.mockReturnValue([]);
    },
  };
};
