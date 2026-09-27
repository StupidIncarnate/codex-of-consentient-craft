import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import type { FsError } from '#gateway/node/fs';
import { dungeonmasterHomeFindBrokerProxy } from '../find/dungeonmaster-home-find-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';

export const dungeonmasterHomeEnsureBrokerProxy = (): {
  setupEnsureSuccess: (params: {
    homeDir: string;
    homePath: FilePath;
    guildsPath: FilePath;
  }) => void;
  setupMkdirFails: (params: { homeDir: string; homePath: FilePath; error: FsError }) => void;
} => {
  const findProxy = dungeonmasterHomeFindBrokerProxy();
  const ensureDirHandle = ensureDirProxy();
  // `join` (above) MUST come from '#gateway/node/path', the same specifier the broker imports —
  // see dungeonmaster-home-find-broker.proxy.ts for why mocking raw 'path' from this file would
  // silently miss the broker's own calls.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  // Specific address (homePath, guilds dir name), never a bare `calledWith([])` — see
  // dungeonmaster-home-find-broker.proxy.ts for why a zero-arg join() stage is unsafe to share.
  const joinHandle = registerMock({ fn: join });
  // Sticky real-passthrough default for every OTHER join() call this test never describes.
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupEnsureSuccess: ({
      homeDir,
      homePath,
      guildsPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      guildsPath: FilePath;
    }): void => {
      findProxy.setupHomePath({ homeDir, homePath });
      ensureDirHandle.succeeds({ path: homePath });
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.guildsDir])
        .returns(guildsPath);
      ensureDirHandle.succeeds({ path: guildsPath });
    },
    setupMkdirFails: ({
      homeDir,
      homePath,
      error,
    }: {
      homeDir: string;
      homePath: FilePath;
      error: FsError;
    }): void => {
      findProxy.setupHomePath({ homeDir, homePath });
      ensureDirHandle.rejects({ path: homePath, error });
    },
  };
};
