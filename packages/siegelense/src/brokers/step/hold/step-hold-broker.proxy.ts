/**
 * PURPOSE: Test setup helper for stepHoldBroker — composes child proxies for delay timing,
 * screenshot frame diffing, and final file copying. `dirname`/`join` (from '#gateway/node/path') are
 * mocked directly, each on a sticky real-passthrough default: a shot path's own dirname, and a
 * frame's dir plus its generated filename, are both already-known segments, so the real computed
 * path always matches what the test asserts against `captureLive`'s and `getDestinationPathFor`'s
 * own call args.
 *
 * USAGE:
 * const proxy = stepHoldBrokerProxy();
 * proxy.stagesShot({ path: framePath, width: 10, height: 10, pixels: new Uint8Array([...]) });
 */

import { PNG } from 'pngjs';
import { dirname, join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { asyncDelayAdapterProxy } from '../../../adapters/async/delay/async-delay-adapter.proxy';
import { fsCopyFileAdapterProxy } from '../../../adapters/fs/copy-file/fs-copy-file-adapter.proxy';
import { shotChangeReadBrokerProxy } from '../../shot/change-read/shot-change-read-broker.proxy';

const DEFAULT_FRAME_WIDTH = 2;
const DEFAULT_FRAME_HEIGHT = 2;
const BYTES_PER_RGBA_PIXEL = 4;
const DEFAULT_TOTAL_PIXEL_BYTES = DEFAULT_FRAME_WIDTH * DEFAULT_FRAME_HEIGHT * BYTES_PER_RGBA_PIXEL;
const OPAQUE_WHITE_CHANNEL = 255;

const defaultPng = new PNG({ width: DEFAULT_FRAME_WIDTH, height: DEFAULT_FRAME_HEIGHT });
defaultPng.data = Buffer.from(new Uint8Array(DEFAULT_TOTAL_PIXEL_BYTES).fill(OPAQUE_WHITE_CHANNEL));
const DEFAULT_FRAME_PNG = PNG.sync.write(defaultPng).toString('latin1');

export const stepHoldBrokerProxy = (): {
  getRequestedDelay: ReturnType<typeof asyncDelayAdapterProxy>['getRequestedDelay'];
  stagesShot: ReturnType<typeof shotChangeReadBrokerProxy>['stagesShot'];
  stagesDefaultShot: ReturnType<typeof shotChangeReadBrokerProxy>['stagesDefaultShot'];
  succeedsCopy: (params: { sourcePath: AbsoluteFilePath }) => void;
  getDestinationPathFor: (params: { sourcePath: AbsoluteFilePath }) => unknown;
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
  const delayProxy = asyncDelayAdapterProxy();
  const shotChangeProxy = shotChangeReadBrokerProxy();
  const copyProxy = fsCopyFileAdapterProxy();

  shotChangeProxy.stagesDefaultShot({ content: DEFAULT_FRAME_PNG });

  return {
    getRequestedDelay: delayProxy.getRequestedDelay,
    stagesShot: shotChangeProxy.stagesShot,
    stagesDefaultShot: shotChangeProxy.stagesDefaultShot,
    succeedsCopy: copyProxy.succeeds,
    getDestinationPathFor: copyProxy.getDestinationPathFor,
  };
};
