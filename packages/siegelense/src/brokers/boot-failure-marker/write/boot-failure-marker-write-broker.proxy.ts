/**
 * PURPOSE: Composes the file-write mock `bootFailureMarkerWriteBroker` makes off an evidence path a
 * test already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `pathJoinAdapterProxy` is constructed only to satisfy `enforce-proxy-child-creation` and
 * its `.returns()` is never called — see `boot-failure-marker-read-broker.proxy.ts`'s own header for
 * why: a `.returns()` one-shot lands on a queue shared globally by every composed `pathJoinAdapter`
 * mock, and a composing caller resolving OTHER real paths around this one would have its own
 * resolution corrupted by a one-shot meant for this broker alone. Real passthrough already computes
 * the correct joined path for this broker's own two segments.
 *
 * USAGE:
 * const proxy = bootFailureMarkerWriteBrokerProxy();
 * proxy.setupWriteSucceeds({ evidencePath, nowMs });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const bootFailureMarkerWriteBrokerProxy = (): {
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
      const markerPathValue = `${evidencePath}/${locationsStatics.siegelense.bootFailure}`;
      writeProxy.succeeds({ filePath: AbsoluteFilePathStub({ value: markerPathValue }) });
      dateHandle.calledWith([]).returns(nowMs);
    },

    getWrittenMarkerContent: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): unknown =>
      writeProxy.getWrittenFor({
        filePath: AbsoluteFilePathStub({
          value: `${evidencePath}/${locationsStatics.siegelense.bootFailure}`,
        }),
      }),
  };
};
