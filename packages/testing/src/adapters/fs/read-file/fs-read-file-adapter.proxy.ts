import { readFileSync } from 'fs';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

jest.mock('fs');

export const fsReadFileAdapterProxy = (): {
  returns: ({ content }: { filePath: string; content: FileContent }) => void;
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(readFileSync);

  mock.mockReturnValue('');

  return {
    returns: ({ content }: { filePath: string; content: FileContent }): void => {
      mock.mockReturnValueOnce(content);
    },
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
