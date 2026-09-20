/**
 * PURPOSE: Composes the file-write mock `shutdownReasonWriteBroker` makes off an evidence path a
 * test already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `pathJoinAdapterProxy` is constructed only to satisfy `enforce-proxy-child-creation` and
 * its `.returns()` is never called — see `boot-failure-marker-write-broker.proxy.ts`'s own header for
 * why a one-shot here would corrupt an unrelated caller's real resolution on the same shared queue.
 *
 * USAGE:
 * const proxy = shutdownReasonWriteBrokerProxy();
 * proxy.setupWriteSucceeds({ evidencePath, nowMs });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const shutdownReasonWriteBrokerProxy = (): {
  setupWriteSucceeds: (params: { evidencePath: AbsoluteFilePath; nowMs: number }) => void;
  getWrittenMarkerContent: (params: { evidencePath: AbsoluteFilePath }) => unknown;
} => {
  pathJoinAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const dateHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupWriteSucceeds: ({
      evidencePath,
      nowMs,
    }: {
      evidencePath: AbsoluteFilePath;
      nowMs: number;
    }): void => {
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`;
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: markerPathValue }) });
      dateHandle.calledWith([]).returns(nowMs);
    },

    getWrittenMarkerContent: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): unknown =>
      writeProxy.getWrittenFor({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.shutdownReason}`,
        }),
      }),
  };
};
