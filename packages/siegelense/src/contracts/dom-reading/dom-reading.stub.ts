import type { StubArgument } from '@dungeonmaster/shared/@types';

import { DomNodeStub } from '../dom-node/dom-node.stub';
import { domReadingContract } from './dom-reading-contract';
import type { DomReading } from './dom-reading-contract';

export const DomReadingStub = ({ ...props }: StubArgument<DomReading> = {}): DomReading => {
  const data: Record<PropertyKey, unknown> = {
    count: 1,
    showing: 1,
    capped: false,
    note: null,
    nodes: [DomNodeStub()],
    ...props,
  };
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  return domReadingContract.parse(filtered);
};
