import { z } from 'zod';
import { fileHandleSchema } from './file-handle-schema';
import { FileHandleStub } from './file-handle.stub';

describe('fileHandleSchema', () => {
  describe('valid value', () => {
    it('VALID: {FileHandleStub()} => parses to the same stub reference', () => {
      const handle = FileHandleStub({ size: 0, contents: '' });

      const parsed = fileHandleSchema.parse(handle);

      expect(parsed).toBe(handle);
    });
  });

  describe('invalid value', () => {
    it('INVALID: {object missing read} => throws a ZodError', () => {
      const partial = { stat: (): null => null, close: (): null => null };

      expect(() => fileHandleSchema.parse(partial)).toThrow(z.ZodError);
    });

    it('INVALID: {stat is not a function} => throws a ZodError', () => {
      const partial = { stat: 1, read: (): null => null, close: (): null => null };

      expect(() => fileHandleSchema.parse(partial)).toThrow(z.ZodError);
    });

    it('EMPTY: {value: undefined} => throws a ZodError', () => {
      expect(() => fileHandleSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });
});
