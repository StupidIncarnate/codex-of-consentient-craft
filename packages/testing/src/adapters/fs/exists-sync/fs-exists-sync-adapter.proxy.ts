/**
 * PURPOSE: Proxy for fs-exists-sync-adapter that mocks fs.existsSync, addressed by path
 *
 * USAGE:
 * const proxy = fsExistsSyncAdapterProxy();
 * proxy.returns({ filePath, exists: true });
 * // existsSync(filePath) now returns true; an unstaged path throws, naming itself
 * proxy.existsOnlyFor({ filePaths: ['/repo/a.ts'] });
 * // Every path is answered: true for the listed ones, false for the rest — a directory listing
 */

import { existsSync } from 'fs';
import { registerMock } from '../../../register-mock';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ filePath, exists }: { filePath: string; exists: boolean }) => void;
  existsOnlyFor: ({ filePaths }: { filePaths: readonly string[] }) => void;
  existsWhereMatching: ({ pattern }: { pattern: RegExp }) => void;
} => {
  const mock = registerMock({ fn: existsSync });

  return {
    returns: ({ filePath, exists }: { filePath: string; exists: boolean }): void => {
      mock.calledWith([filePath]).returns(exists);
    },
    existsOnlyFor: ({ filePaths }: { filePaths: readonly string[] }): void => {
      mock
        .calledWith([isPath])
        .implement(((candidate: string) => filePaths.includes(candidate)) as never);
    },
    existsWhereMatching: ({ pattern }: { pattern: RegExp }): void => {
      mock
        .calledWith([isPath])
        .implement(((candidate: string) => pattern.test(candidate)) as never);
    },
  };
};
