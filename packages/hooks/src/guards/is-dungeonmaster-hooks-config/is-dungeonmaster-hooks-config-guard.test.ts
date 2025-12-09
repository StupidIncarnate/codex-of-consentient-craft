import { isDungeonmasterHooksConfigGuard } from './is-dungeonmaster-hooks-config-guard';
import { DungeonmasterHooksConfigStub } from '../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config.stub';

describe('isDungeonmasterHooksConfigGuard', () => {
  describe('valid input', () => {
    it('VALID: {valid config} => returns true', () => {
      const config = DungeonmasterHooksConfigStub();

      const result = isDungeonmasterHooksConfigGuard(config);

      expect(result).toBe(true);
    });

    it('VALID: {config with preEditLint} => returns true', () => {
      const config = DungeonmasterHooksConfigStub({
        preEditLint: { rules: ['custom-rule'] },
      });

      const result = isDungeonmasterHooksConfigGuard(config);

      expect(result).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {null} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard(null);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {undefined} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard(undefined);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {string} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard('not a config');

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {number} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard(123);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {object without preEditLint} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard({ other: 'property' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {array} => returns false', () => {
      const result = isDungeonmasterHooksConfigGuard([]);

      expect(result).toBe(false);
    });
  });
});
