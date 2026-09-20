import { rawDomReadingContract } from './raw-dom-reading-contract';
import { RawDomReadingStub } from './raw-dom-reading.stub';

describe('rawDomReadingContract', () => {
  it('VALID: {default stub} => parses exact RawDomReading shape', () => {
    const raw = RawDomReadingStub();

    const result = rawDomReadingContract.parse(raw);

    expect(result).toStrictEqual({
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

  it('INVALID: {count: -1} => throws validation error for negative count', () => {
    expect(() => {
      rawDomReadingContract.parse({ count: -1, nodes: [] });
    }).toThrow(/Number must be greater than or equal to 0/u);
  });
});
