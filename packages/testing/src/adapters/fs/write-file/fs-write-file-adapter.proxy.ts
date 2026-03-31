/**
 * PURPOSE: Proxy for fs-write-file-adapter
 *
 * USAGE:
 * const proxy = fsWriteFileAdapterProxy();
 * proxy.throws({ filePath: '/path', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { writeFileSync } from 'fs';
import { registerMock } from '../../../register-mock';

export const fsWriteFileAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const mock = registerMock({ fn: writeFileSync });

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
    getCallArgs: (): readonly unknown[][] => mock.mock.calls,
  };
};
