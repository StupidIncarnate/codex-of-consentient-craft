import { streamTextContract } from './stream-text-contract';
import { StreamTextStub } from './stream-text.stub';

describe('streamTextContract', () => {
  describe('valid stream text', () => {
    it('VALID: {value: "Hello"} => parses successfully', () => {
      const result = StreamTextStub({ value: 'Hello' });

      expect(result).toBe('Hello');
    });

    it('VALID: {value: multiline text} => parses successfully', () => {
      const result = StreamTextStub({ value: 'Line 1\nLine 2\nLine 3' });

      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('VALID: {default stub} => returns default value', () => {
      const result = StreamTextStub();

      expect(result).toBe('Hello from Claude');
    });

    it('VALID: {value: empty string} => parses successfully', () => {
      const result = streamTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid stream text', () => {
    it('INVALID_TYPE: {value: number} => throws validation error', () => {
      expect(() => {
        streamTextContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {value: null} => throws validation error', () => {
      expect(() => {
        streamTextContract.parse(null as never);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {value: undefined} => throws validation error', () => {
      expect(() => {
        streamTextContract.parse(undefined as never);
      }).toThrow(/Required/u);
    });
  });
});
