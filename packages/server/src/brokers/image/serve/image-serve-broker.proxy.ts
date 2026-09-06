import type { dirname, join } from 'path';

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  fsExistsSyncAdapterProxy,
  locationsQuestImagesPathFindBrokerProxy,
  pathDirnameAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { requireActual } from '@dungeonmaster/testing/register-mock';

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
  const existsProxy = fsExistsSyncAdapterProxy();
  processDevLogAdapterProxy();
  // These three default to a REAL passthrough (see their own comments), and none is staged here on
  // purpose: the confinement compares a dirname against a join, so staging either one would
  // replace the comparison under test with whatever this proxy decided the answer should be.
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();
  locationsQuestImagesPathFindBrokerProxy();

  // The quest file each setup method describes is addressed by its EXACT path, built with the real
  // path module rather than the mocked one, so a broker that probed some other path (the images
  // directory's own quest.json, say) falls through to fsExistsSyncAdapterProxy's `false` default
  // and the test goes red instead of quietly matching a looser address.
  const realPath = requireActual<{ dirname: typeof dirname; join: typeof join }>({
    module: 'path',
  });

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
        filePath: FilePathStub({
          value: realPath.join(
            realPath.dirname(realPath.dirname(filePath)),
            locationsStatics.quest.questFile,
          ),
        }),
        result: true,
      });
    },
    // Same file on disk, but the directory two levels up is nobody's quest folder — the shape of
    // any `images` directory that happens to exist on the host.
    setupFileBytesWithoutQuestFile: ({ filePath, bytes }): void => {
      realpathProxy.returns({ filePath, realPath: filePath });
      readProxy.returns({ filePath, bytes });
      existsProxy.returns({
        filePath: FilePathStub({
          value: realPath.join(
            realPath.dirname(realPath.dirname(filePath)),
            locationsStatics.quest.questFile,
          ),
        }),
        result: false,
      });
    },
    setupReadFailure: ({ filePath, error }): void => {
      realpathProxy.returns({ filePath, realPath: filePath });
      readProxy.throws({ filePath, error });
      existsProxy.returns({
        filePath: FilePathStub({
          value: realPath.join(
            realPath.dirname(realPath.dirname(filePath)),
            locationsStatics.quest.questFile,
          ),
        }),
        result: true,
      });
    },
  };
};
