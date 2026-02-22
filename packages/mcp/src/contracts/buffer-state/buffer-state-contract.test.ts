import { bufferStateContract } from './buffer-state-contract';
import { BufferStateStub } from './buffer-state.stub';

describe('bufferStateContract', () => {
  describe('VALID', () => {
    it('{value: ""} => parses empty string', () => {
      const result = bufferStateContract.parse({ value: '' });

      expect(result.value).toBe('');
    });

    it('{value: "data"} => parses string with content', () => {
      const result = bufferStateContract.parse({ value: 'accumulated data' });

      expect(result.value).toBe('accumulated data');
    });

    it('BufferStateStub() => creates valid default state', () => {
      const result = BufferStateStub();

      expect(result.value).toBe('');
    });
  });

  describe('INVALID', () => {
    it('{value: 123} => rejects non-string value', () => {
      expect(() => bufferStateContract.parse({ value: 123 })).toThrow('Expected string');
    });

    it('{} => rejects missing value', () => {
      expect(() => bufferStateContract.parse({})).toThrow('Required');
    });
  });
});
