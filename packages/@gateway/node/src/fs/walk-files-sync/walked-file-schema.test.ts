import { z } from 'zod';
import { walkedFileSchema } from './walked-file-schema';

describe('walkedFileSchema', () => {
  describe('valid shape', () => {
    it('VALID: {path, sizeBytes, modifiedAtMs} => parses to the same object reference', () => {
      const walked = { path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0 };

      const parsed = walkedFileSchema.parse(walked);

      expect(parsed).toBe(walked);
    });
  });

  describe('invalid shape', () => {
    it('INVALID: {value missing sizeBytes} => throws a ZodError', () => {
      const walked = { path: '/repo/a.jsonl', modifiedAtMs: 0 };

      expect(() => walkedFileSchema.parse(walked)).toThrow(z.ZodError);
    });

    it('EMPTY: {value: undefined} => throws a ZodError', () => {
      expect(() => walkedFileSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });
});
