import { wardOutputContract } from './ward-output-contract';
import type { WardOutputStub } from './ward-output.stub';

type WardOutput = ReturnType<typeof WardOutputStub>;

describe('wardOutputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty string} => returns branded WardOutput', () => {
      const result: WardOutput = wardOutputContract.parse('');

      expect(result).toBe('');
    });

    it('VALID: {output with errors} => returns branded WardOutput', () => {
      const output = '/src/file.ts:10:5 - error: Missing return type';

      const result: WardOutput = wardOutputContract.parse(output);

      expect(result).toBe('/src/file.ts:10:5 - error: Missing return type');
    });

    it('VALID: {multiline output} => returns branded WardOutput', () => {
      const output = 'Line 1\nLine 2\nLine 3';

      const result: WardOutput = wardOutputContract.parse(output);

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {null} => throws validation error', () => {
      expect(() => wardOutputContract.parse(null)).toThrow(/expected string/iu);
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => wardOutputContract.parse(123 as never)).toThrow(/expected string/iu);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => wardOutputContract.parse(undefined)).toThrow(/required/iu);
    });
  });
});

describe('WardOutputStub', () => {
  it('VALID: {default} => returns empty string', () => {
    const { WardOutputStub: Stub } = require('./ward-output.stub');
    const result = Stub();

    expect(result).toBe('');
  });

  it('VALID: {custom value} => returns custom value', () => {
    const { WardOutputStub: Stub } = require('./ward-output.stub');
    const result = Stub({ value: '/src/file.ts:10:5 - error' });

    expect(result).toBe('/src/file.ts:10:5 - error');
  });
});
