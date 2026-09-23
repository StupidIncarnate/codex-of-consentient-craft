/**
 * PURPOSE: Proxy for fs-symlink-adapter
 *
 * USAGE:
 * const proxy = fsSymlinkAdapterProxy();
 * proxy.throws({ targetPath: '/target', linkPath: '/link', error: new Error('fail') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { symlinkSync } from 'fs';
import { registerMock } from '../../../register-mock';
import type { RecordedCalls } from '../../../register-mock';

export const fsSymlinkAdapterProxy = (): {
  throws: ({
    targetPath,
    linkPath,
    error,
  }: {
    targetPath: string;
    linkPath: string;
    error: Error;
  }) => void;
  getCallArgs: () => RecordedCalls;
} => {
  const mock = registerMock({ fn: symlinkSync });

  mock.calledWith([]).implement(() => undefined);

  return {
    throws: ({
      targetPath,
      linkPath,
      error,
    }: {
      targetPath: string;
      linkPath: string;
      error: Error;
    }): void => {
      mock.calledWith([targetPath, linkPath]).throws(error);
    },
    getCallArgs: (): RecordedCalls => mock.callsMatching([]),
  };
};
