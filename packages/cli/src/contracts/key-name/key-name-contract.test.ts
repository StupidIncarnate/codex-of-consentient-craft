import { keyNameContract } from './key-name-contract';
import { KeyNameStub } from './key-name.stub';

describe('keyNameContract', () => {
  describe('valid key names', () => {
    it('VALID: {value: "enter"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'enter' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('enter');
    });

    it('VALID: {value: "escape"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'escape' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('escape');
    });

    it('VALID: {value: "up"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'up' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('up');
    });

    it('VALID: {value: "down"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'down' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('down');
    });

    it('VALID: {value: "backspace"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'backspace' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('backspace');
    });

    it('VALID: {value: "tab"} => parses successfully', () => {
      const keyName = KeyNameStub({ value: 'tab' });

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('tab');
    });

    it('VALID: {stub default} => parses with default value "enter"', () => {
      const keyName = KeyNameStub();

      const result = keyNameContract.parse(keyName);

      expect(result).toBe('enter');
    });
  });

  describe('invalid key names', () => {
    it('INVALID_KEY: {value: "space"} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse('space');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_KEY: {value: "ctrl"} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse('ctrl');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_KEY: {value: ""} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_KEY: {value: 123} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse(123 as never);
      }).toThrow(/invalid_type/u);
    });

    it('INVALID_KEY: {value: null} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse(null as never);
      }).toThrow(/invalid_type/u);
    });

    it('INVALID_KEY: {value: undefined} => throws validation error', () => {
      expect(() => {
        return keyNameContract.parse(undefined as never);
      }).toThrow(/Required/u);
    });
  });
});
