import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// serverVersionReadAdapter resolves `@dungeonmaster/server/package.json` via the REAL
// `require.resolve` (a language primitive, not an imported binding, so it cannot be staged with
// registerMock) — confirmed to resolve to this worktree's own packages/server/package.json from
// both the repo root and from inside packages/server/src/**. The only mockable step is the
// readFileSync call that follows, so every case here is addressed by a path-shape predicate
// rather than the exact resolved path, mirroring design-scaffold-broker.proxy.ts's
// `filePath: (value) => String(value).endsWith('/package.json')` idiom.
const isPackageJsonPath = (value: unknown): boolean => String(value).endsWith('/package.json');

export const serverVersionReadAdapterProxy = (): {
  returnsVersion: (params: { version: string }) => void;
  returnsPackageJsonWithoutVersion: () => void;
  returnsPackageJsonWithEmptyVersion: () => void;
  throwsReadError: () => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    returnsVersion: ({ version }: { version: string }): void => {
      handle.calledWith([isPackageJsonPath]).returns(JSON.stringify({ version }));
    },
    returnsPackageJsonWithoutVersion: (): void => {
      handle.calledWith([isPackageJsonPath]).returns(JSON.stringify({}));
    },
    returnsPackageJsonWithEmptyVersion: (): void => {
      handle.calledWith([isPackageJsonPath]).returns(JSON.stringify({ version: '' }));
    },
    throwsReadError: (): void => {
      handle.calledWith([isPackageJsonPath]).implement(() => {
        throw new Error('ENOENT: no such file or directory');
      });
    },
  };
};
