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
  returns: ({ filePath, content }: { filePath: string; content: FileContent }) => void;
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  mock.mockReturnValue('');

  return {
    returns: ({ filePath, content }: { filePath: string; content: FileContent }): void => {
      mock.calledWith([filePath]).returns(content);
    },
    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      mock.calledWith([filePath]).throws(error);
    },
  };
};
