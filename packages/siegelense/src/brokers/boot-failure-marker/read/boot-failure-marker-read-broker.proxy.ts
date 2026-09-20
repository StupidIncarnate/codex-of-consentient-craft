/**
 * PURPOSE: Composes the file-read mock `bootFailureMarkerReadBroker` makes off an evidence path a
 * test already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `pathJoinAdapterProxy` is constructed only to satisfy `enforce-proxy-child-creation` and
 * its `.returns()` is never called: this proxy is composed inside `instanceStartBootPollLayerBroker`'s
 * own proxy, itself composed inside `instanceStartBroker`'s — a chain that resolves every OTHER path
 * through `pathJoinAdapter`'s REAL passthrough (see that proxy's own comment), sharing ONE queue
 * across every composed resolver. A `.returns()` here would push a one-shot onto that SAME shared
 * queue and get consumed by whichever real `join()` call happens to run next, not necessarily this
 * broker's own — silently corrupting an unrelated resolution. Real passthrough already computes the
 * correct joined path for this broker's own two segments, so nothing needs staging.
 *
 * USAGE:
 * const proxy = bootFailureMarkerReadBrokerProxy();
 * proxy.setupMarkerFound({ evidencePath, marker });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
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
  pathJoinAdapterProxy();
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
