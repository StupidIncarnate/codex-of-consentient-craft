import type { StubArgument } from '@dungeonmaster/shared/@types';

import { PixelCoordinateStub } from '../pixel-coordinate/pixel-coordinate.stub';
import { domRectContract } from './dom-rect-contract';
import type { DomRect } from './dom-rect-contract';

export const DomRectStub = ({ ...props }: StubArgument<DomRect> = {}): DomRect =>
  domRectContract.parse({
    x: PixelCoordinateStub({ value: 10 }),
    y: PixelCoordinateStub({ value: 20 }),
    width: 100,
    height: 50,
    ...props,
  });
