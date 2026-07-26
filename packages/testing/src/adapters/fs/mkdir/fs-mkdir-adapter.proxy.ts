/**
 * PURPOSE: Proxy for fs-mkdir-adapter
 *
 * USAGE:
 * const proxy = fsMkdirAdapterProxy();
 * proxy.throws({ dirPath: '/path', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { mkdirSync } from 'fs';
import { registerMock } from '../../../register-mock';

export const fsMkdirAdapterProxy = (): {
  throws: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const mock = registerMock({ fn: mkdirSync });

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      mock.calledWith([dirPath]).throws(error);
    },
    getCallArgs: (): readonly unknown[][] => mock.mock.calls,
  };
};
