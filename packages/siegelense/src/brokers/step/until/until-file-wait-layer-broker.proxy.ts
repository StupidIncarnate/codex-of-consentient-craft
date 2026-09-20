// PURPOSE: Proxy for until-file-wait-layer-broker — composes fs-stat-adapter's own proxy for the
// one I/O boundary this broker crosses, and stages Date.now ONLY when a test needs a controlled
// "waited Xms" figure. Staging the clock unconditionally would spy on every Date.now() call for the
// rest of the test, including ones a "file already there" scenario never described.
// USAGE: const proxy = untilFileWaitLayerBrokerProxy(); proxy.fileAppears({ filePath });

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';

export const untilFileWaitLayerBrokerProxy = (): {
  fileAppears: (params: { filePath: AbsoluteFilePath }) => void;
  fileNeverAppears: (params: { filePath: AbsoluteFilePath }) => void;
  stageElapsedMs: (params: { nowMs: number }) => void;
} => {
  const statProxy = fsStatAdapterProxy();
  // Constructed for its own default behavior only, to satisfy enforce-proxy-child-creation —
  // `pathJoinAdapter`'s real passthrough is exactly what a test wants here, since `fileAppears`/
  // `fileNeverAppears` stage `fsStatAdapter` against the caller's own already-joined path.
  pathJoinAdapterProxy();

  return {
    fileAppears: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.resolves({ filePath, sizeBytes: 10, modifiedAtMs: 0 });
    },

    fileNeverAppears: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      statProxy.rejects({
        filePath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        }),
      });
    },

    // Every call to Date.now() anywhere in this test answers `nowMs` — the broker's own
    // `waitedMs`/ceiling checks are its only calls to it, so one fixed value is enough to pin
    // both the success reading's elapsed figure and a ceiling check's outcome.
    stageElapsedMs: ({ nowMs }: { nowMs: number }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(nowMs);
    },
  };
};
