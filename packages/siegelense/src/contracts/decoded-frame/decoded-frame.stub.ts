import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PixelCountStub } from '../pixel-count/pixel-count.stub';
import { decodedFrameContract } from './decoded-frame-contract';
import type { DecodedFrame } from './decoded-frame-contract';

// One RGBA pixel (opaque black) — the smallest frame the contract accepts.
const DEFAULT_PIXELS = new Uint8Array([0, 0, 0, 255]);

export const DecodedFrameStub = ({ ...props }: StubArgument<DecodedFrame> = {}): DecodedFrame =>
  decodedFrameContract.parse({
    width: PixelCountStub({ value: 1 }),
    height: PixelCountStub({ value: 1 }),
    pixels: DEFAULT_PIXELS,
    ...props,
  });
