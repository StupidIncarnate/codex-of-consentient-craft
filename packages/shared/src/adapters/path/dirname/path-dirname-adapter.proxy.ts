import { dirname } from 'path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const handle = registerMock({ fn: dirname });

  // THE JOIN/DIRNAME/BASENAME TRAP (see tmp/sweep-guidance.md): the old default returned
  // the SAME path unchanged, which is not what dirname does — it only "worked" because
  // every walk-up broker (config-root-find, project-root-find, guild-path-walk-up,
  // tsconfig-path-find, and the eslint/hook config-path-find walkers) always explicitly
  // stages every dirname call it needs, including the "reached root" case. The base default
  // is now a REAL passthrough via requireActual so any call nobody staged gets a genuine
  // parent directory instead of an echo. `returns()` stays call-order-scoped (`onceFor([])`)
  // — unchanged from today's behavior — because a live one-shot still outranks the sticky
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
