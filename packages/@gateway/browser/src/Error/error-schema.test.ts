import { z } from 'zod';
import { errorSchema } from './error-schema';
import { ErrorStub } from './error.stub';

describe('errorSchema', () => {
  describe('valid value', () => {
    it('VALID: {ErrorStub()} => parses to the same error reference', () => {
      const error = ErrorStub();

      const parsed = errorSchema.parse(error);

      expect(parsed).toBe(error);
    });

    it('VALID: {a TypeError} => parses a subclass of Error to the same reference', () => {
      const error = new TypeError('bad');

      const parsed = errorSchema.parse(error);

      expect(parsed).toBe(error);
    });
  });

  describe('invalid value', () => {
    it('INVALID: {a string} => throws a ZodError', () => {
      expect(() => errorSchema.parse('boom')).toThrow(z.ZodError);
    });

    it('INVALID: {a plain object with message} => throws a ZodError', () => {
      expect(() => errorSchema.parse({ message: 'boom' })).toThrow(z.ZodError);
    });

    it('EMPTY: {value: undefined} => throws a ZodError', () => {
      expect(() => errorSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });
});
