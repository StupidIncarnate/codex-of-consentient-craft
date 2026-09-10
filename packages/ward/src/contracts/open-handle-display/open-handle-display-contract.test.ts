import { openHandleDisplayContract } from './open-handle-display-contract';
import { OpenHandleDisplayStub } from './open-handle-display.stub';

describe('openHandleDisplayContract', () => {
  describe('valid displays', () => {
    it('VALID: {a rendered leak line} => parses to the same string', () => {
      const display = OpenHandleDisplayStub({
        value: '  ward  setInterval still armed\n      at a (a.ts:1:1)',
      });

      expect(display).toBe('  ward  setInterval still armed\n      at a (a.ts:1:1)');
    });

    it('EMPTY: {""} => parses, because a handle with no message and no frames still renders', () => {
      expect(OpenHandleDisplayStub({ value: '' })).toBe('');
    });
  });

  describe('invalid displays', () => {
    it('INVALID: {42} => throws', () => {
      expect(() => openHandleDisplayContract.parse(42)).toThrow(/Expected string/u);
    });

    it('EMPTY: {undefined} => throws', () => {
      expect(() => openHandleDisplayContract.parse(undefined)).toThrow(/Required/u);
    });
  });
});
