import { existsSync, type PathLike } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ filePath, result }: { filePath: FilePath; result: boolean }) => void;
  implementation: ({ fn }: { fn: (filePath: PathLike) => boolean }) => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // Default: any unaddressed path is treated as non-existent. Widely-consumed default —
  // packages/ward and packages/cli compose this adapter proxy via @dungeonmaster/shared/testing
  // and rely on "false" for paths they never explicitly stage.
  handle.calledWith([]).returns(false);

  return {
    // Keyed on the path so multiple candidate checks in one test don't collide.
    returns: ({ filePath, result }: { filePath: FilePath; result: boolean }): void => {
      handle.calledWith([filePath]).returns(result);
    },
    // Base-default override: caller's fn decides per-path, addressed by the real argument
    // inside its own body (see walk-reachable-files-layer-broker.proxy.ts).
    implementation: ({ fn }: { fn: (filePath: PathLike) => boolean }): void => {
      handle.calledWith([]).implement(((filePath: PathLike) => fn(filePath)) as never);
    },
  };
};
