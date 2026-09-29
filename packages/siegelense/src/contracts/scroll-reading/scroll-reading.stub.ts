import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PixelCountStub } from '../pixel-count/pixel-count.stub';
import { scrollReadingContract } from './scroll-reading-contract';
import type { ScrollReading } from './scroll-reading-contract';

export const ScrollReadingStub = ({ ...props }: StubArgument<ScrollReading> = {}): ScrollReading =>
  scrollReadingContract.parse({
    scrollX: PixelCountStub({ value: 0 }),
    scrollY: PixelCountStub({ value: 0 }),
    scrollWidth: PixelCountStub({ value: 1280 }),
    scrollHeight: PixelCountStub({ value: 720 }),
    viewportWidth: PixelCountStub({ value: 1280 }),
    viewportHeight: PixelCountStub({ value: 720 }),
    ...props,
  });
