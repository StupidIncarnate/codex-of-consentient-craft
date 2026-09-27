import { z } from 'zod';
import { ChildProcess } from 'child_process';
import { childProcessSchema } from './child-process-schema';
import { ChildProcessStub } from './child-process.stub';

describe('childProcessSchema', () => {
  describe('valid value', () => {
    it('VALID: {a real ChildProcess instance} => parses to the same object reference', () => {
      const child = new ChildProcess();

      const parsed = childProcessSchema.parse(child);

      expect(parsed).toBe(child);
    });

    it('VALID: {ChildProcessStub()} => parses to the same stub reference', () => {
      const child = ChildProcessStub();

      const parsed = childProcessSchema.parse(child);

      expect(parsed).toBe(child);
    });
  });

  describe('invalid value', () => {
    it('INVALID: {a plain object shaped like a ChildProcess} => throws a ZodError', () => {
      const notAChildProcess = { pid: 1, stdout: null, stderr: null, stdin: null };

      expect(() => childProcessSchema.parse(notAChildProcess)).toThrow(z.ZodError);
    });

    it('EMPTY: {value: undefined} => throws a ZodError', () => {
      expect(() => childProcessSchema.parse(undefined)).toThrow(z.ZodError);
    });
  });
});
