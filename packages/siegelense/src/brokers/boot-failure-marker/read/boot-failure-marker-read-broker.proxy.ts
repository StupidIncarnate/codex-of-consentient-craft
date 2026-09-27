/**
 * PURPOSE: Composes the file-read mock `bootFailureMarkerReadBroker` makes off an evidence path a
 * test already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `#gateway/node/path` is a raw passthrough of the Node 'path' module (no per-function
 * wrapper, so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
 * specifier the broker imports. Every segment the broker's own `join` call passes (`evidencePath`, a
 * literal filename) is already known to this proxy's own callers, and the real computation always
 * lands on the same value a test's own template-literal assertion expects — so only the sticky
 * real-passthrough default is installed; nothing needs staging with `.returns()`.
 *
 * USAGE:
 * const proxy = bootFailureMarkerReadBrokerProxy();
 * proxy.setupMarkerFound({ evidencePath, marker });
 */

import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';

type BootFailureMarker = ReturnType<typeof BootFailureMarkerStub>;

export const bootFailureMarkerReadBrokerProxy = (): {
  setupMarkerFound: (params: { evidencePath: AbsoluteFilePath; marker: BootFailureMarker }) => void;
  setupMarkerMissing: (params: { evidencePath: AbsoluteFilePath }) => void;
  setupReadFails: (params: { evidencePath: AbsoluteFilePath; error: Error }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const readProxy = fsReadFileAdapterProxy();

  return {
    setupMarkerFound: ({
      evidencePath,
      marker,
    }: {
      evidencePath: AbsoluteFilePath;
      marker: BootFailureMarker;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.bootFailure}`;
      readProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: markerPathValue }),
        content: `${JSON.stringify(marker)}\n`,
      });
    },

    setupMarkerMissing: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.bootFailure}`;
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: markerPathValue }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },

    setupReadFails: ({
      evidencePath,
      error,
    }: {
      evidencePath: AbsoluteFilePath;
      error: Error;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.bootFailure}`;
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: markerPathValue }),
        error,
      });
    },
  };
};
