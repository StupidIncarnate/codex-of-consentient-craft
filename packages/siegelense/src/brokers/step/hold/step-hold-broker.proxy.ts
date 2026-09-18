/**
 * PURPOSE: Test setup helper for stepHoldBroker — composes child proxies for path manipulation,
 * delay timing, screenshot frame diffing, and final file copying.
 *
 * USAGE:
 * const proxy = stepHoldBrokerProxy();
 * proxy.stagesShot({ path: framePath, width: 10, height: 10, pixels: new Uint8Array([...]) });
 */

import { PNG } from 'pngjs';
import { pathDirnameAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
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
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();
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
