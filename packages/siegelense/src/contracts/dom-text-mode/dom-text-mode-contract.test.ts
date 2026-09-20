import { domTextModeContract } from './dom-text-mode-contract';
import { DomTextModeStub } from './dom-text-mode.stub';

describe('domTextModeContract', () => {
  it('VALID: {default stub} => parses "own"', () => {
    const mode = DomTextModeStub();

    const result = domTextModeContract.parse(mode);

    expect(result).toBe('own');
  });

  it('VALID: {value: "full"} => parses "full"', () => {
    const mode = DomTextModeStub({ value: 'full' });

    const result = domTextModeContract.parse(mode);

    expect(result).toBe('full');
  });

  it('INVALID: {value: "invalid"} => throws ZodError for unrecognized mode', () => {
    expect(() => {
      domTextModeContract.parse('invalid');
    }).toThrow(/Invalid enum value/u);
  });
});
