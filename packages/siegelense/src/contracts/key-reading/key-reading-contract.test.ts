import { FocusedElementStub } from '../focused-element/focused-element.stub';
import { keyReadingContract } from './key-reading-contract';
import { KeyReadingStub } from './key-reading.stub';

describe('keyReadingContract', () => {
  it('VALID: minimal key reading (nothing focused) => parses', () => {
    const stub = KeyReadingStub();
    const result = keyReadingContract.parse(stub);

    expect(result).toStrictEqual({
      press: 'Enter',
      focused: null,
    });
  });

  it('VALID: key reading with focused element => parses', () => {
    const focused = FocusedElementStub({
      tag: 'input',
      testId: 'NAME_INPUT',
      text: 'alice',
      ref: 14,
    });
    const result = keyReadingContract.parse({
      press: 'Tab',
      focused,
    });

    expect(result).toStrictEqual({
      press: 'Tab',
      focused: {
        tag: 'input',
        testId: 'NAME_INPUT',
        role: null,
        domId: null,
        text: 'alice',
        ref: 14,
      },
    });
  });

  it('INVALID: missing press => throws', () => {
    expect(() =>
      keyReadingContract.parse({
        focused: null,
      } as never),
    ).toThrow(/Required/u);
  });

  it('INVALID: extra field => throws because strict()', () => {
    expect(() =>
      keyReadingContract.parse({
        press: 'Enter',
        focused: null,
        extra: 'not-allowed',
      } as never),
    ).toThrow(/unrecognized/iu);
  });
});
