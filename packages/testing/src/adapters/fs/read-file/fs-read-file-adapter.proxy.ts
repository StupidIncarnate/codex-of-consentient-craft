/**
 * PURPOSE: Proxy for fs-read-file-adapter
 *
 * USAGE:
 * const proxy = fsReadFileAdapterProxy();
 * proxy.returns({ filePath: '/path', content: FileContentStub({ value: 'test' }) });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { readFileSync } from 'fs';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';
import { registerMock } from '../../../register-mock';

export const fsReadFileAdapterProxy = (): {
  returns: ({ content }: { filePath: string; content: FileContent }) => void;
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

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
