/**
 * PURPOSE: Composes the file-write mock `shutdownReasonWriteBroker` makes off an evidence path a
 * test already has in hand — no evidence-path resolution to stage, since the broker takes that path
 * directly. `#gateway/node/path` is a raw passthrough of the Node 'path' module (no per-function
 * wrapper, so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
 * specifier the broker imports. Every segment the broker's own `join` call passes (`evidencePath`, a
 * literal filename) is already known to this proxy's own callers, and the real computation always
 * lands on the same value a test's own template-literal assertion expects — so only the sticky
 * real-passthrough default is installed; nothing needs staging with `.returns()`.
 *
 * USAGE:
 * const proxy = shutdownReasonWriteBrokerProxy();
 * proxy.setupWriteSucceeds({ evidencePath, nowMs });
 */

import { join } from '#gateway/node/path';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const shutdownReasonWriteBrokerProxy = (): {
  setupWriteSucceeds: (params: { evidencePath: AbsoluteFilePath; nowMs: number }) => void;
  getWrittenMarkerContent: (params: { evidencePath: AbsoluteFilePath }) => unknown;
} => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
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
