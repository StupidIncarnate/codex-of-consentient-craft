import { frameworkPresetKeysStatics } from './framework-preset-keys-statics';

describe('frameworkPresetKeysStatics', () => {
  describe('keys.all', () => {
    it('VALID: contains all framework preset keys', () => {
      const result = frameworkPresetKeysStatics.keys.all;

      expect(result).toStrictEqual([
        'widgets',
        'bindings',
        'state',
        'flows',
        'responders',
        'contracts',
        'brokers',
        'transformers',
        'errors',
        'middleware',
        'adapters',
        'startup',
      ]);
    });

    it('VALID: is readonly array', () => {
      const keys = frameworkPresetKeysStatics.keys.all;

      expect(Array.isArray(keys)).toBe(true);
      expect(Object.isFrozen(frameworkPresetKeysStatics)).toBe(true);
    });
  });
});
