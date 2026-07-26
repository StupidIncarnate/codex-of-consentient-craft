import { readdirSync } from 'fs';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { registerMock } from '../../../register-mock';

export const fsReaddirAdapterProxy = (): {
  returns: ({ dirPath, files }: { dirPath: string; files: FileName[] }) => void;
  throws: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readdirSync });

  mock.calledWith([]).returns([]);

  return {
    returns: ({ dirPath, files }: { dirPath: string; files: FileName[] }): void => {
      mock.calledWith([dirPath]).returns(files);
    },
    throws: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      mock.calledWith([dirPath]).throws(error);
    },
  };
};
