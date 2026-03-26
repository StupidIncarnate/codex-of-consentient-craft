import { readFileSync } from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}));

export const fsReadJsonSyncAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFileSync);

  mock.mockReturnValue('' as never);

  return {
    returns: ({ content }: { content: string }): void => {
      mock.mockReturnValueOnce(content as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
