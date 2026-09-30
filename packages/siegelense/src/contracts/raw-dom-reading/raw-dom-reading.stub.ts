import type { StubArgument } from '@dungeonmaster/shared/@types';

import { DomRectStub } from '../dom-rect/dom-rect.stub';
import { rawDomReadingContract } from './raw-dom-reading-contract';
import type { RawDomReading } from './raw-dom-reading-contract';

export const RawDomReadingStub = ({ ...props }: StubArgument<RawDomReading> = {}): RawDomReading =>
  rawDomReadingContract.parse({
    count: 1,
    nodes: [
      {
        tagName: 'button',
        testId: 'SUBMIT_BTN',
        className: 'btn primary',
        childCount: 0,
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
