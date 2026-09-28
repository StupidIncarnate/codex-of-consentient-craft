/**
 * PURPOSE: Composes the file-read mock `shutdownReasonReadBroker` makes off an evidence path a test
 * already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `#gateway/node/path` is a raw passthrough of the Node 'path' module (no per-function
 * wrapper, so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
 * specifier the broker imports. Every segment the broker's own `join` call passes (`evidencePath`, a
 * literal filename) is already known to this proxy's own callers, and the real computation always
 * lands on the same value a test's own template-literal assertion expects — so only the sticky
 * real-passthrough default is installed; nothing needs staging with `.returns()`.
 *
 * USAGE:
 * const proxy = shutdownReasonReadBrokerProxy();
 * proxy.setupMarkerFound({ evidencePath, marker });
 */

import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';

type ShutdownReason = ReturnType<typeof ShutdownReasonStub>;

export const shutdownReasonReadBrokerProxy = (): {
  setupMarkerFound: (params: { evidencePath: AbsoluteFilePath; marker: ShutdownReason }) => void;
  setupMarkerMissing: (params: { evidencePath: AbsoluteFilePath }) => void;
  setupReadFails: (params: { evidencePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const readProxy = readFileIfExistsProxy();

  return {
    setupMarkerFound: ({
      evidencePath,
      marker,
    }: {
      evidencePath: AbsoluteFilePath;
      marker: ShutdownReason;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      readProxy.returns({
        path: markerPathValue,
        contents: `${JSON.stringify(marker)}\n`,
      });
    },

    setupMarkerMissing: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      readProxy.missing({ path: markerPathValue });
    },

    setupReadFails: ({
      evidencePath,
      error,
    }: {
      evidencePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      readProxy.throwsMatchingPath({
        path: markerPathValue,
        error: error as FsError,
      });
    },
  };
};
