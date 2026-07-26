/**
 * PURPOSE: Proxy for fs-rm-adapter
 *
 * USAGE:
 * const proxy = fsRmAdapterProxy();
 * proxy.throws({ filePath: '/path', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { rmSync } from 'fs';
import { registerMock } from '../../../register-mock';

export const fsRmAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const mock = registerMock({ fn: rmSync });

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      mock.onceFor([filePath]).throws(error);
    },
    getCallArgs: (): readonly unknown[][] => mock.mock.calls,
  };
};
