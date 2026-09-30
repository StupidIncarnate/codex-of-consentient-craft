import type { StubArgument } from '@dungeonmaster/shared/@types';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { rawDomReadingContract } from './raw-dom-reading-contract';
import type { RawDomReading } from './raw-dom-reading-contract';

export const RawDomReadingStub = ({ ...props }: StubArgument<RawDomReading> = {}): RawDomReading =>
  rawDomReadingContract.parse({
    count: ReadingCountStub({ value: 1 }),
    nodes: [
      {
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
      },
    ],
    ...props,
  });
