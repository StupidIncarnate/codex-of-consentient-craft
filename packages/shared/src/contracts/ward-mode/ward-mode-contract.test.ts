import { wardModeContract } from './ward-mode-contract';
import { WardModeStub } from './ward-mode.stub';

describe('wardModeContract', () => {
  describe('the two modes it accepts', () => {
    it('VALID: {"committed"} => parses unchanged', () => {
      expect(wardModeContract.parse('committed')).toBe('committed');
    });

    it('VALID: {"full"} => parses unchanged', () => {
      expect(wardModeContract.parse('full')).toBe('full');
    });
  });

  describe('the pre-rename value on disk', () => {
    // Quests written before ward's `--changed` became `--committed` carry `wardMode: "changed"`. A
    // bare enum rejects the whole quest.json over that one field, so a live quest could no longer
    // be loaded at all.
    it('VALID: {"changed"} => parses forward to "committed"', () => {
      expect(wardModeContract.parse('changed')).toBe('committed');
    });
  });

  describe('anything else', () => {
    it('INVALID: {"staged"} => throws', () => {
      expect(() => wardModeContract.parse('staged')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {"uncommitted"} => throws, because no ward item ever ran that scope', () => {
      expect(() => wardModeContract.parse('uncommitted')).toThrow(/Invalid enum value/u);
    });
  });

  describe('WardModeStub', () => {
    it('VALID: {no argument} => defaults to "committed"', () => {
      expect(WardModeStub()).toBe('committed');
    });

    it('VALID: {value: "full"} => returns that mode', () => {
      expect(WardModeStub({ value: 'full' })).toBe('full');
    });
  });
});
