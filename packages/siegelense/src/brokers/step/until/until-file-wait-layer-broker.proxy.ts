// PURPOSE: Proxy for until-file-wait-layer-broker — composes statIfExistsProxy for the
// one I/O boundary this broker crosses, and stages Date.now ONLY when a test needs a controlled
// "waited Xms" figure. Staging the clock unconditionally would spy on every Date.now() call for the
// rest of the test, including ones a "file already there" scenario never described. `join` (from
// '#gateway/node/path') is mocked directly, on a sticky real-passthrough default — the home path and
// the file name are both already known, so the real computed path is exactly what `fileAppears`/
// `fileNeverAppears` stage `statIfExists` against.
// USAGE: const proxy = untilFileWaitLayerBrokerProxy(); proxy.fileAppears({ filePath });

import { join } from '#gateway/node/path';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';

import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

export const untilFileWaitLayerBrokerProxy = (): {
  fileAppears: (params: { filePath: string }) => void;
  fileNeverAppears: (params: { filePath: string }) => void;
  stageElapsedMs: (params: { nowMs: number }) => void;
} => {
  const statProxy = statIfExistsProxy();
  setTimeoutProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  return {
    fileAppears: ({ filePath }: { filePath: string }): void => {
      statProxy.returnsFile({ path: filePath, sizeBytes: 10, modifiedAtMs: 0 });
    },

    fileNeverAppears: ({ filePath }: { filePath: string }): void => {
      statProxy.missing({ path: filePath });
    },

    // Every call to Date.now() anywhere in this test answers `nowMs` — the broker's own
    // `waitedMs`/ceiling checks are its only calls to it, so one fixed value is enough to pin
    // both the success reading's elapsed figure and a ceiling check's outcome.
    stageElapsedMs: ({ nowMs }: { nowMs: number }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(nowMs);
    },
  };
};
