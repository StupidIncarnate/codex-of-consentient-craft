import type { StubArgument } from '@dungeonmaster/shared/@types';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { domNodeContract } from './dom-node-contract';
import type { DomNode } from './dom-node-contract';

export const DomNodeStub = ({ ...props }: StubArgument<DomNode> = {}): DomNode => {
  const data: Record<PropertyKey, unknown> = {
    tagName: 'button',
    testId: 'SUBMIT_BTN',
    className: 'btn primary',
    childCount: ReadingCountStub({ value: 0 }),
    display: 'inline-block',
    visibility: 'visible',
    opacity: '1',
    rect: DomRectStub(),
    text: 'Submit',
    attrs: [],
    value: null,
    ...props,
  };
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  return domNodeContract.parse(filtered);
};
