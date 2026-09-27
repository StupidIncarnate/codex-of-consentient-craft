/**
 * PURPOSE: Proxy for typescript-source-file-getter-adapter — the TypeScript program runs real; the
 * adapter's own fallback read (`fs.readFileSync` for a file the program does not hold) is staged by
 * path. `readsRealFiles()` also stages real passthroughs for `fs.existsSync`, `fs.mkdtempSync`,
 * `fs.writeFileSync` and `fs.rmSync`: a multi-file `ts.createProgram` compile resolves each file's
 * relative imports through `importPathResolverMiddleware`, which probes candidate extensions with
 * `fsExistsSyncAdapter` before reading one (a SEPARATE 'fs' export from the one this adapter itself
 * calls), and a test building that multi-file fixture on a real temp dir writes and tears it down with
 * the other three. Staging all five here — rather than leaving the write/cleanup trio unstaged and
 * relying on the unit-test I/O trap's own from-test-infrastructure fallback to let them through — is
 * what keeps the fixture-building test fast: that fallback walks the call stack on every unstaged
 * call, and five of those on one test measured close to two real seconds against ward's one-second
 * slow-test bar, where five real passthroughs dispatch through registerMock's argument matching
 * instead. All five stay on this ONE colocated proxy (`enforce-proxy-one-import` forbids importing
 * `fsExistsSyncAdapterProxy` from a sibling adapter).
 *
 * USAGE:
 * const proxy = typescriptSourceFileGetterAdapterProxy();
 * proxy.fileContains({ filePath, content: 'export const x = 1;' });
 * proxy.fileMissing({ filePath });
 * proxy.readsRealFiles(); // for a test that compiles a real program over real files
 */

import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { registerMock, requireActual } from '../../../register-mock';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

interface RealFs {
  readFileSync: typeof readFileSync;
  existsSync: typeof existsSync;
  mkdtempSync: typeof mkdtempSync;
  writeFileSync: typeof writeFileSync;
  rmSync: typeof rmSync;
}

export const typescriptSourceFileGetterAdapterProxy = (): {
  fileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  fileMissing: ({ filePath }: { filePath: string }) => void;
  readsRealFiles: () => void;
} => {
  const mock = registerMock({ fn: readFileSync });
  const existsMock = registerMock({ fn: existsSync });
  const mkdtempMock = registerMock({ fn: mkdtempSync });
  const writeFileMock = registerMock({ fn: writeFileSync });
  const rmMock = registerMock({ fn: rmSync });

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
      const real = requireActual<RealFs>({ module: 'fs' });
      mock
        .calledWith([isPath])
        .implement(((...args: Parameters<typeof readFileSync>) =>
          real.readFileSync(...args)) as never);
      existsMock
        .calledWith([isPath])
        .implement(((...args: Parameters<typeof existsSync>) => real.existsSync(...args)) as never);
      mkdtempMock
        .calledWith([isPath])
        .implement(((...args: Parameters<typeof mkdtempSync>) =>
          real.mkdtempSync(...args)) as never);
      writeFileMock.calledWith([isPath]).implement(((...args: Parameters<typeof writeFileSync>) => {
        real.writeFileSync(...args);
      }) as never);
      rmMock.calledWith([isPath]).implement(((...args: Parameters<typeof rmSync>) => {
        real.rmSync(...args);
      }) as never);
    },
  };
};
