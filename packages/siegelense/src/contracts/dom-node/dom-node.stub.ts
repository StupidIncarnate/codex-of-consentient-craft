import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { domNodeContract } from './dom-node-contract';
import type { DomNode } from './dom-node-contract';

export const DomNodeStub = ({ ...props }: StubArgument<DomNode> = {}): DomNode => {
  const data: Record<PropertyKey, unknown> = {
    tagName: ContentTextStub({ value: 'button' }),
    testId: ContentTextStub({ value: 'SUBMIT_BTN' }),
    className: ContentTextStub({ value: 'btn primary' }),
    childCount: ReadingCountStub({ value: 0 }),
    display: ContentTextStub({ value: 'inline-block' }),
    visibility: ContentTextStub({ value: 'visible' }),
    opacity: ContentTextStub({ value: '1' }),
    rect: DomRectStub(),
    text: ContentTextStub({ value: 'Submit' }),
    attrs: [],
    value: null,
    ...props,
  };
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  return domNodeContract.parse(filtered);
};
