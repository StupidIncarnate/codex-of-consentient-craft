import { FocusedElementStub } from './focused-element.stub';
import { focusedElementContract } from './focused-element-contract';

describe('focusedElementContract', () => {
  it('VALID: minimal focused element => parses', () => {
    const stub = FocusedElementStub();
    const result = focusedElementContract.parse(stub);

    expect(result).toStrictEqual({
      tag: 'input',
      testId: null,
      role: null,
      domId: null,
      text: null,
      ref: null,
    });
  });

  it('VALID: full focused element with testId, text, ref => parses', () => {
    const result = focusedElementContract.parse({
      tag: 'input',
      testId: 'NAME_INPUT',
      role: 'textbox',
      domId: 'name-field',
      text: 'alice',
      ref: 14,
    });

    expect(result).toStrictEqual({
      tag: 'input',
      testId: 'NAME_INPUT',
      role: 'textbox',
      domId: 'name-field',
      text: 'alice',
      ref: 14,
    });
  });

  it('INVALID: missing tag => throws', () => {
    expect(() =>
      focusedElementContract.parse({
        testId: null,
        role: null,
        domId: null,
        text: null,
        ref: null,
      } as never),
    ).toThrow(/Required/u);
  });

  it('INVALID: unrecognized extra key => throws because strict()', () => {
    expect(() =>
      focusedElementContract.parse({
        tag: 'input',
        testId: null,
        role: null,
        domId: null,
        text: null,
        ref: null,
        extra: 'forbidden',
      } as never),
    ).toThrow(/unrecognized/iu);
  });
});
