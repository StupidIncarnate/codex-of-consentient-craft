/**
 * PURPOSE: Proxy for fs-write-file-adapter
 *
 * USAGE:
 * const proxy = fsWriteFileAdapterProxy();
 * proxy.throws({ filePath: '/path', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { writeFileSync } from 'fs';

jest.mock('fs');

export const fsWriteFileAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(writeFileSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
