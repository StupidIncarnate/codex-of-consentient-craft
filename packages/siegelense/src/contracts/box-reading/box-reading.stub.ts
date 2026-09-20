import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PixelCoordinateStub } from '../pixel-coordinate/pixel-coordinate.stub';
import { PixelCountStub } from '../pixel-count/pixel-count.stub';
import { RefStub } from '../ref/ref.stub';
import { boxReadingContract } from './box-reading-contract';
import type { BoxReading } from './box-reading-contract';

export const BoxReadingStub = ({ ...props }: StubArgument<BoxReading> = {}): BoxReading =>
  boxReadingContract.parse({
    ref: RefStub({ value: 26 }),
    x: PixelCoordinateStub({ value: 607 }),
    y: PixelCoordinateStub({ value: 472 }),
    width: PixelCountStub({ value: 66 }),
    height: PixelCountStub({ value: 27 }),
    viewport: {
      width: PixelCountStub({ value: 1280 }),
      height: PixelCountStub({ value: 720 }),
    },
    visible: true,
    inViewport: true,
    ...props,
  });
