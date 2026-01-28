import { callbackKeyContract } from './callback-key-contract';
import { CallbackKeyStub } from './callback-key.stub';

describe('callbackKeyContract', () => {
  describe('valid callback keys', () => {
    it('VALID: {non-empty string} => parses successfully', () => {
      const key = CallbackKeyStub({ value: 'onSubmit' });

      const result = callbackKeyContract.parse(key);

      expect(result).toBe('onSubmit');
    });

    it('VALID: {default stub} => parses successfully', () => {
      const key = CallbackKeyStub();

      const result = callbackKeyContract.parse(key);

      expect(result).toBe('onClick');
    });
  });

  describe('invalid callback keys', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        callbackKeyContract.parse('');
      }).toThrow(/too_small/u);
    });
  });
});
