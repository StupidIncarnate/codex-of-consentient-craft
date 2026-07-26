/**
 * PURPOSE: Proxy for fs-exists-adapter
 *
 * USAGE:
 * const proxy = fsExistsAdapterProxy();
 * proxy.returns({ filePath: '/path', exists: true });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { existsSync } from 'fs';
import { registerMock } from '../../../register-mock';

export const fsExistsAdapterProxy = (): {
  returns: ({ filePath, exists }: { filePath: string; exists: boolean }) => void;
} => {
  const mock = registerMock({ fn: existsSync });

  mock.calledWith([]).returns(false);

  return {
    returns: ({ filePath, exists }: { filePath: string; exists: boolean }): void => {
      mock.calledWith([filePath]).returns(exists);
    },
  };
};
