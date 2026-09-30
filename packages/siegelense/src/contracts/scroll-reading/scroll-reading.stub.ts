import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scrollReadingContract } from './scroll-reading-contract';
import type { ScrollReading } from './scroll-reading-contract';

export const ScrollReadingStub = ({ ...props }: StubArgument<ScrollReading> = {}): ScrollReading =>
  scrollReadingContract.parse({
    scrollX: 0,
    scrollY: 0,
    scrollWidth: 1280,
    scrollHeight: 720,
    viewportWidth: 1280,
    viewportHeight: 720,
    ...props,
  });
