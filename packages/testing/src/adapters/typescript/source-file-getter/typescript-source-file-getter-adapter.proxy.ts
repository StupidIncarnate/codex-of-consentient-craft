/**
 * PURPOSE: Proxy for typescript-source-file-getter-adapter — the TypeScript program runs real; the
 * adapter's own fallback read (`fs.readFileSync` for a file the program does not hold) is staged by
 * path
 *
 * USAGE:
 * const proxy = typescriptSourceFileGetterAdapterProxy();
 * proxy.fileContains({ filePath, content: 'export const x = 1;' });
 * proxy.fileMissing({ filePath });
 * proxy.readsRealFiles(); // for a test that compiles a real program over real files
 */

import { readFileSync } from 'fs';
import { registerMock, requireActual } from '../../../register-mock';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const typescriptSourceFileGetterAdapterProxy = (): {
  fileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  fileMissing: ({ filePath }: { filePath: string }) => void;
  readsRealFiles: () => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  return {
    fileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      mock.calledWith([filePath]).returns(content);
    },
    fileMissing: ({ filePath }: { filePath: string }): void => {
      mock.calledWith([filePath]).throws(
        Object.assign(new Error(`ENOENT: no such file or directory, open '${filePath}'`), {
          code: 'ENOENT',
        }),
      );
    },
    readsRealFiles: (): void => {
      const real = requireActual<{ readFileSync: typeof readFileSync }>({ module: 'fs' });
      mock
        .calledWith([isPath])
        .implement(((...args: Parameters<typeof readFileSync>) =>
          real.readFileSync(...args)) as never);
    },
  };
};
