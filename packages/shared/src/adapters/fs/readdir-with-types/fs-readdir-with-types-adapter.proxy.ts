import { readdirSync, type Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const fsReaddirWithTypesAdapterProxy = (): {
  returns: (params: { dirPath: AbsoluteFilePath; entries: Dirent[] }) => void;
  throws: (params: { dirPath: AbsoluteFilePath; error: Error }) => void;
  implementation: (params: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const handle = registerMock({ fn: readdirSync });

  // Composing proxies instantiate several sibling proxies over this same fs mock purely so
  // their code paths don't crash on directories the test never describes. This
  // lowest-specificity fallback keeps that working: a call to a directory nobody staged
  // returns [] instead of throwing, while a directory-specific `returns`/`throws`/
  // `implementation` staged below always outranks it (higher specificity, or later at a tie).
  // Known lint gap: @dungeonmaster/enforce-proxy-patterns does not yet recognize
  // `handle.calledWith(...).returns(...)` as legitimate constructor-level mock setup (it only
  // recognizes the old `handle.mockReturnValue(...)` shape) — a fix is tracked separately.
  handle.calledWith([]).returns([]);

  return {
    returns: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: Dirent[] }): void => {
      handle.calledWith([dirPath]).returns(entries as never);
    },
    throws: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([dirPath]).throws(error);
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      handle.calledWith([]).implement(fn as never);
    },
  };
};
