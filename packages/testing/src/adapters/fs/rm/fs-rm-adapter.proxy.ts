/**
 * PURPOSE: Proxy for fs-rm-adapter
 *
 * USAGE:
 * const proxy = fsRmAdapterProxy();
 * proxy.throws({ filePath: '/path', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { rmSync } from 'fs';

jest.mock('fs');

export const fsRmAdapterProxy = (): {
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(rmSync);

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
