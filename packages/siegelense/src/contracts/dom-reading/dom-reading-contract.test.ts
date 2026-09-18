import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DomNodeStub } from '../dom-node/dom-node.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { domReadingContract } from './dom-reading-contract';
import { DomReadingStub } from './dom-reading.stub';

describe('domReadingContract', () => {
  it('VALID: {default stub} => parses exact DomReading shape', () => {
    const reading = DomReadingStub();

    const result = domReadingContract.parse(reading);

    expect(result).toStrictEqual({
      count: 1,
      showing: 1,
      capped: false,
      note: null,
      nodes: [
        {
          tagName: 'button',
          testId: 'SUBMIT_BTN',
          className: 'btn primary',
          childCount: 0,
          display: 'inline-block',
          visibility: 'visible',
          opacity: '1',
          rect: {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
          },
          text: 'Submit',
          attrs: [],
          value: null,
        },
      ],
    });
  });

  it('VALID: {pure count reading} => parses reading with only count', () => {
    const reading = DomReadingStub({
      count: ReadingCountStub({ value: 42 }),
      showing: undefined,
      capped: undefined,
      note: undefined,
      nodes: undefined,
    });

    const result = domReadingContract.parse(reading);

    expect(result).toStrictEqual({
      count: 42,
    });
  });

  it('VALID: {capped reading with note} => parses reading with capped: true and warning note', () => {
    const reading = DomReadingStub({
      count: ReadingCountStub({ value: 58 }),
      showing: ReadingCountStub({ value: 10 }),
      capped: true,
      note: ContentTextStub({ value: 'count: 58, showing 10, capped. Narrow this.' }),
      nodes: [DomNodeStub()],
    });

    const result = domReadingContract.parse(reading);

    expect(result).toStrictEqual({
      count: 58,
      showing: 10,
      capped: true,
      note: 'count: 58, showing 10, capped. Narrow this.',
      nodes: [
        {
          tagName: 'button',
          testId: 'SUBMIT_BTN',
          className: 'btn primary',
          childCount: 0,
          display: 'inline-block',
          visibility: 'visible',
          opacity: '1',
          rect: {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
          },
          text: 'Submit',
          attrs: [],
          value: null,
        },
      ],
    });
  });

  it('INVALID: {unrecognized key} => throws strict validation error', () => {
    expect(() => {
      domReadingContract.parse({ count: 1, extraKey: 'invalid' });
    }).toThrow(/Unrecognized key/u);
  });
});
