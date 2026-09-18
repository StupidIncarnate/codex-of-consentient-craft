import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { rawDomReadingContract } from './raw-dom-reading-contract';
import type { RawDomReading } from './raw-dom-reading-contract';

export const RawDomReadingStub = ({ ...props }: StubArgument<RawDomReading> = {}): RawDomReading =>
  rawDomReadingContract.parse({
    count: ReadingCountStub({ value: 1 }),
    nodes: [
      {
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
      },
    ],
    ...props,
  });
