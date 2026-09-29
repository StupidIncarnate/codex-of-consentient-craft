import { z } from 'zod';
import { bufferSchema } from './buffer-schema';
import { BufferInstanceStub } from './buffer-instance.stub';

describe('bufferSchema', () => {
  describe('valid value', () => {
    it('VALID: {BufferInstanceStub({text: "output"})} => parses to the same buffer reference', () => {
      const buffer = BufferInstanceStub({ text: 'output' });

      const parsed = bufferSchema.parse(buffer);

      expect(parsed).toBe(buffer);
    });

    it('EMPTY: {BufferInstanceStub({text: ""})} => parses an empty buffer to the same reference', () => {
      const buffer = BufferInstanceStub({ text: '' });

      const parsed = bufferSchema.parse(buffer);

      expect(parsed).toBe(buffer);
    });
  });

  describe('invalid value', () => {
    it('INVALID: {a string} => throws a ZodError', () => {
      expect(() => bufferSchema.parse('output')).toThrow(z.ZodError);
    });

    it('INVALID: {a plain Uint8Array} => throws a ZodError', () => {
      expect(() => bufferSchema.parse(new Uint8Array([1, 2]))).toThrow(z.ZodError);
    });

    it('EMPTY: {value: undefined} => throws a ZodError', () => {
      expect(() => bufferSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });
});
