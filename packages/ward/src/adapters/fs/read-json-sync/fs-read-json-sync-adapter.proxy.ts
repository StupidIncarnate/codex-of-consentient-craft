import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadJsonSyncAdapterProxy = (): {
  returns: (params: { filePath: FilePath; content: string }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  // The typecheck-refs broker reads one tsconfig.json per package folder in a loop, and some
  // callers only assert on the aggregated discoveredCount across every folder, not which
  // folder's tsconfig produced which patterns. Those callers describe every path with one
  // predicate instead of enumerating each project folder's tsconfig path by hand.
  returnsForAnyPath: (params: { content: string }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  return {
    returns: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      mock.calledWith([String(filePath)]).returns(content as never);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([String(filePath)]).throws(error);
    },
    returnsForAnyPath: ({ content }: { content: string }): void => {
      mock
        .calledWith([(filePath: unknown) => typeof filePath === 'string'])
        .returns(content as never);
    },
  };
};
