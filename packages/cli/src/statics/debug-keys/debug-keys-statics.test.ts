import { debugKeysStatics } from './debug-keys-statics';

describe('debugKeysStatics', () => {
  describe('structure', () => {
    it('VALID: {debugKeysStatics} => contains only codes object with expected keys', () => {
      expect(debugKeysStatics).toStrictEqual({
        codes: {
          enter: '\r',
          escape: '\x1B',
          up: '\x1B[A',
          down: '\x1B[B',
          backspace: '\x7F',
          tab: '\t',
        },
      });
    });
  });

  describe('codes', () => {
    it('VALID: {codes.enter} => returns carriage return escape code', () => {
      expect(debugKeysStatics.codes.enter).toBe('\r');
    });

    it('VALID: {codes.escape} => returns escape character code', () => {
      expect(debugKeysStatics.codes.escape).toBe('\x1B');
    });

    it('VALID: {codes.up} => returns up arrow escape sequence', () => {
      expect(debugKeysStatics.codes.up).toBe('\x1B[A');
    });

    it('VALID: {codes.down} => returns down arrow escape sequence', () => {
      expect(debugKeysStatics.codes.down).toBe('\x1B[B');
    });

    it('VALID: {codes.backspace} => returns delete character code', () => {
      expect(debugKeysStatics.codes.backspace).toBe('\x7F');
    });

    it('VALID: {codes.tab} => returns horizontal tab escape code', () => {
      expect(debugKeysStatics.codes.tab).toBe('\t');
    });
  });
});
