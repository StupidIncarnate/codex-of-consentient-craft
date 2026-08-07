import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileName } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { dirPath: string; files: FileName[] }) => void;
  throws: (params: { dirPath: string; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readdirSync });

  return {
    returns: ({ dirPath, files }: { dirPath: string; files: FileName[] }): void => {
      handle.calledWith([dirPath]).returns(files as never);
    },
    throws: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      handle.calledWith([dirPath]).throws(error);
    },
  };
};
