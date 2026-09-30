import type { StubArgument } from '@dungeonmaster/shared/@types';

import { RefStub } from '../ref/ref.stub';
import { boxReadingContract } from './box-reading-contract';
import type { BoxReading } from './box-reading-contract';

export const BoxReadingStub = ({ ...props }: StubArgument<BoxReading> = {}): BoxReading =>
  boxReadingContract.parse({
    ref: RefStub({ value: 26 }),
    x: 607,
    y: 472,
    width: 66,
    height: 27,
    viewport: {
      width: 1280,
      height: 720,
    },
    visible: true,
    inViewport: true,
    ...props,
  });
