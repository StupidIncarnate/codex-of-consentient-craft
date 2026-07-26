import { dirname } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: dirname });

  // The base default is a REAL passthrough via requireActual, not an echo of the input path:
  // every walk-up broker (config-root-find, project-root-find, guild-path-walk-up,
  // tsconfig-path-find, and the eslint/hook config-path-find walkers) explicitly stages every
  // dirname call it needs, including the "reached root" case, so an unstaged call only ever
  // hits this default when a genuine parent directory is the correct answer. `returns()` stays
  // call-order-scoped (`onceFor([])`) because a live one-shot still outranks the sticky
  // real-passthrough default.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  handle.calledWith([]).implement((inputPath: never) => realPath.dirname(inputPath));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }): void => {
      handle.onceFor([]).returns(result);
    },
  };
};
