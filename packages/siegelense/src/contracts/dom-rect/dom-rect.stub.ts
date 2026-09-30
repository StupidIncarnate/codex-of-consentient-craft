import type { StubArgument } from '@dungeonmaster/shared/@types';

import { domRectContract } from './dom-rect-contract';
import type { DomRect } from './dom-rect-contract';

export const DomRectStub = ({ ...props }: StubArgument<DomRect> = {}): DomRect =>
  domRectContract.parse({
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    ...props,
  });
