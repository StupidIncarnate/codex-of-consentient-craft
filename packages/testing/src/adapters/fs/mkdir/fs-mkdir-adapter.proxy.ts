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
import type { RecordedCalls } from '../../../register-mock';

export const fsMkdirAdapterProxy = (): {
  throws: ({ dirPath, error }: { dirPath: string; error: Error }) => void;
  getCallArgs: () => RecordedCalls;
} => {
  const mock = registerMock({ fn: mkdirSync });

  mock.calledWith([]).implement(() => undefined);

  return {
    throws: ({ dirPath, error }: { dirPath: string; error: Error }): void => {
      mock.calledWith([dirPath]).throws(error);
    },
    getCallArgs: (): RecordedCalls => mock.callsMatching([]),
  };
};
