import { BootLockHeldError } from './boot-lock-held-error';

describe('BootLockHeldError', () => {
  describe('constructor()', () => {
    it('VALID: {heldBy: "inst_1a2b3c4d", waitedMs: 5000} => sets name and full message', () => {
      const error = new BootLockHeldError({ heldBy: 'inst_1a2b3c4d', waitedMs: 5000 });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BootLockHeldError',
        message:
          'Boot lock held by inst_1a2b3c4d; gave up after waiting 5000ms past the wait ceiling',
      });
    });

    it('EDGE: {waitedMs: 0} => embeds the zero wait in the message', () => {
      const error = new BootLockHeldError({ heldBy: 'inst_deadbeef', waitedMs: 0 });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'BootLockHeldError',
        message: 'Boot lock held by inst_deadbeef; gave up after waiting 0ms past the wait ceiling',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof BootLockHeldError => returns true', () => {
      const error = new BootLockHeldError({ heldBy: 'inst_1a2b3c4d', waitedMs: 5000 });

      expect(error instanceof BootLockHeldError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new BootLockHeldError({ heldBy: 'inst_1a2b3c4d', waitedMs: 5000 });

      expect(error instanceof Error).toBe(true);
    });
  });
});
