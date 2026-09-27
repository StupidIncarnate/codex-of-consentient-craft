import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { dirname, join } from '#gateway/node/path';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { locationsQuestImagesPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { fsReadFileBytesAdapterProxy } from '../../../adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.proxy';
import { fsRealpathAdapterProxy } from '../../../adapters/fs/realpath/fs-realpath-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

export const imageServeBrokerProxy = (): {
  setupFileBytes: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  setupFileBytesWithoutQuestFile: (params: {
    filePath: AbsoluteFilePath;
    bytes: Uint8Array;
  }) => void;
  setupReadFailure: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readProxy = fsReadFileBytesAdapterProxy();
  const realpathProxy = fsRealpathAdapterProxy();
  const existsProxy = existsSyncProxy();
  processDevLogAdapterProxy();
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });
  const realPath = requireActual<{ dirname: typeof dirname; join: typeof join }>({
    module: 'path',
  });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  dirnameHandle.calledWith([]).implement((path: string) => realPath.dirname(path));
  locationsQuestImagesPathFindBrokerProxy();

  return {
    // A plain file in a real quest's images directory: realpath answers with the path it was asked
    // about, and the quest folder holding that images directory has a quest file. A test that needs
    // a path resolving somewhere ELSE is describing a symlink, and a symlink staged through a mock
    // only ever proves the mock — that case belongs in images-flow.integration.test.ts, against a
    // real link on a real filesystem.
    setupFileBytes: ({ filePath, bytes }): void => {
      realpathProxy.returns({ filePath, realPath: filePath });
      readProxy.returns({ filePath, bytes });
      existsProxy.returns({
        path: realPath.join(
          realPath.dirname(realPath.dirname(filePath)),
          locationsStatics.quest.questFile,
        ),
        exists: true,
      });
    },
    // Same file on disk, but the directory two levels up is nobody's quest folder — the shape of
    // any `images` directory that happens to exist on the host.
    setupFileBytesWithoutQuestFile: ({ filePath, bytes }): void => {
      realpathProxy.returns({ filePath, realPath: filePath });
      readProxy.returns({ filePath, bytes });
      existsProxy.returns({
        path: realPath.join(
          realPath.dirname(realPath.dirname(filePath)),
          locationsStatics.quest.questFile,
        ),
        exists: false,
      });
    },
    setupReadFailure: ({ filePath, error }): void => {
      realpathProxy.returns({ filePath, realPath: filePath });
      readProxy.throws({ filePath, error });
      existsProxy.returns({
        path: realPath.join(
          realPath.dirname(realPath.dirname(filePath)),
          locationsStatics.quest.questFile,
        ),
        exists: true,
      });
    },
  };
};
