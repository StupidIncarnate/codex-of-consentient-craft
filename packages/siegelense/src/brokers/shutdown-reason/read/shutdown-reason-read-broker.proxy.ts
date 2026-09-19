/**
 * PURPOSE: Composes the file-read mock `shutdownReasonReadBroker` makes off an evidence path a test
 * already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `pathJoinAdapterProxy` is constructed only to satisfy `enforce-proxy-child-creation` and
 * its `.returns()` is never called — see `boot-failure-marker-read-broker.proxy.ts`'s own header for
 * why a one-shot here would corrupt an unrelated caller's real resolution on the same shared queue.
 *
 * USAGE:
 * const proxy = shutdownReasonReadBrokerProxy();
 * proxy.setupMarkerFound({ evidencePath, marker });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { ShutdownReasonStub } from '../../../contracts/shutdown-reason/shutdown-reason.stub';

type ShutdownReason = ReturnType<typeof ShutdownReasonStub>;

export const shutdownReasonReadBrokerProxy = (): {
  setupMarkerFound: (params: { evidencePath: AbsoluteFilePath; marker: ShutdownReason }) => void;
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
      marker: ShutdownReason;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      readProxy.resolves({
        filePath: AbsoluteFilePathStub({ value: markerPathValue }),
        content: `${JSON.stringify(marker)}\n`,
      });
    },

    setupMarkerMissing: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
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
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      readProxy.rejects({
        filePath: AbsoluteFilePathStub({ value: markerPathValue }),
        error,
      });
    },
  };
};
