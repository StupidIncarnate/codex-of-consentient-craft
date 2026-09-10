/**
 * PURPOSE: Proxy for fs-append-file-adapter
 *
 * USAGE:
 * const proxy = fsAppendFileAdapterProxy();
 * proxy.getCallArgs();
 * // Returns every [filePath, content] pair the adapter appended
 */

import { appendFileSync } from 'fs';
import { registerMock } from '../../../register-mock';
import type { RecordedCalls } from '../../../register-mock';

export const fsAppendFileAdapterProxy = (): {
  throws: ({ filePath, error }: { filePath: string; error: Error }) => void;
  getCallArgs: () => RecordedCalls;
} => {
  const mock = registerMock({ fn: appendFileSync });

  mock.calledWith([]).implement(() => undefined);

  return {
    throws: ({ filePath, error }: { filePath: string; error: Error }): void => {
      mock.onceFor([filePath]).throws(error);
    },
    getCallArgs: (): RecordedCalls => mock.callsMatching([]),
  };
};
