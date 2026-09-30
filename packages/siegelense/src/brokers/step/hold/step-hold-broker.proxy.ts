/**
 * PURPOSE: Test setup helper for stepHoldBroker — composes child proxies for delay timing,
 * screenshot frame diffing, and final file copying. `dirname`/`join` (from '#gateway/node/path') are
 * mocked directly, each on a sticky real-passthrough default: a shot path's own dirname, and a
 * frame's dir plus its generated filename, are both already-known segments, so the real computed
 * path always matches what the test asserts against `captureLive`'s and `getCopiesFrom`'s
 * own call args.
 *
 * USAGE:
 * const proxy = stepHoldBrokerProxy();
 * proxy.stagesShot({ path: framePath, width: 10, height: 10, pixels: new Uint8Array([...]) });
 */

import { PNG } from '#gateway/npm/pngjs';
import { copyFileProxy } from '#gateway/node/fs__promises/copy-file/copy-file.proxy';
import { dirname, join } from '#gateway/node/path';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { shotChangeReadBrokerProxy } from '../../shot/change-read/shot-change-read-broker.proxy';
import { holdStatics } from '../../../statics/hold/hold-statics';
import { Buffer } from '#gateway/node/buffer';

// The gaps between frames the hold tests drive: the default, and the one second the run-verb and
// dispatch tests pass. Each answers at once, so a hold never waits on a real timer.
const ONE_SECOND_MS = 1000;

const DEFAULT_FRAME_WIDTH = 2;
const DEFAULT_FRAME_HEIGHT = 2;
const BYTES_PER_RGBA_PIXEL = 4;
const DEFAULT_TOTAL_PIXEL_BYTES = DEFAULT_FRAME_WIDTH * DEFAULT_FRAME_HEIGHT * BYTES_PER_RGBA_PIXEL;
const OPAQUE_WHITE_CHANNEL = 255;

const defaultPng = new PNG({ width: DEFAULT_FRAME_WIDTH, height: DEFAULT_FRAME_HEIGHT });
defaultPng.data = Buffer.from(new Uint8Array(DEFAULT_TOTAL_PIXEL_BYTES).fill(OPAQUE_WHITE_CHANNEL));
const DEFAULT_FRAME_PNG = new Uint8Array(PNG.sync.write(defaultPng));

export const stepHoldBrokerProxy = (): {
  stagesShot: ReturnType<typeof shotChangeReadBrokerProxy>['stagesShot'];
  stagesDefaultShot: ReturnType<typeof shotChangeReadBrokerProxy>['stagesDefaultShot'];
  succeedsCopy: (params: { sourcePath: string; destinationPath: string }) => void;
  getCopiesFrom: (params: { sourcePath: string }) => readonly unknown[][];
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper, so
  // no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path' specifier
  // the broker imports.
  const realPath = requireActual<{ dirname: typeof dirname; join: typeof join }>({
    module: 'path',
  });
  registerMock({ fn: dirname })
    .calledWith([])
    .implement((inputPath: never) => realPath.dirname(inputPath));
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const timeoutProxy = setTimeoutProxy();
  timeoutProxy.setupFiresImmediately({ ms: holdStatics.defaults.everyMs });
  timeoutProxy.setupFiresImmediately({ ms: ONE_SECOND_MS });
  const shotChangeProxy = shotChangeReadBrokerProxy();
  const copyProxy = copyFileProxy();

  shotChangeProxy.stagesDefaultShot({ bytes: DEFAULT_FRAME_PNG });

  return {
    stagesShot: shotChangeProxy.stagesShot,
    stagesDefaultShot: shotChangeProxy.stagesDefaultShot,
    succeedsCopy: ({ sourcePath, destinationPath }): void => {
      copyProxy.succeeds({ from: sourcePath, to: destinationPath });
    },
    // Every copy of this source, whatever its destination, as [from, to] pairs in call order.
    getCopiesFrom: ({ sourcePath }): readonly unknown[][] =>
      copyProxy.getCallsFor({
        from: sourcePath,
        to: (destination: unknown): boolean => typeof destination === 'string',
      }),
  };
};
