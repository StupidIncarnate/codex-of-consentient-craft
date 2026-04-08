import { readdirSync, type Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReaddirWithTypesAdapterProxy = (): {
  returns: ({ entries }: { entries: Dirent[] }) => void;
  throws: ({ error }: { error: Error }) => void;
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const handle = registerMock({ fn: readdirSync });

  handle.mockReturnValue([]);

  return {
    returns: ({ entries }: { entries: Dirent[] }): void => {
      handle.mockReturnValueOnce(entries as never);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      handle.mockImplementation(fn as never);
    },
  };
};
