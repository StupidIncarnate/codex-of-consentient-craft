/**
 * PURPOSE: Proxy for fs-statfs-adapter — mocks `fs.promises.statfs` for the conversion and error
 * cases. The "genuinely unavailable" branch has no proxy method: proving it means making `statfs`
 * stop being a function on the shared `fs/promises` module, and every mechanism this repo allows
 * outside a guard/contract file either keeps it a function (`registerMock`) or is itself banned here
 * (`Reflect.set`) — see `fs-statfs-adapter.ts`'s own header for the runtime guard this leaves
 * untested by design, not by omission.
 *
 * USAGE:
 * const proxy = fsStatfsAdapterProxy();
 * proxy.resolves({ dirPath, bavail: 512000, bsize: 4096 });
 */

import { statfs } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsStatfsAdapterProxy = (): {
  resolves: (params: { dirPath: AbsoluteFilePath; bavail: number; bsize: number }) => void;
  rejects: (params: { dirPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: statfs });

  return {
    resolves: ({
      dirPath,
      bavail,
      bsize,
    }: {
      dirPath: AbsoluteFilePath;
      bavail: number;
      bsize: number;
    }): void => {
      mock.calledWith([dirPath]).resolves({ bavail, bsize });
    },

    rejects: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },
  };
};
