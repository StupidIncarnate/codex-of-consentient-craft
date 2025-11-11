import { isQuestmaestroHooksConfigGuard } from './is-questmaestro-hooks-config-guard';
import { QuestmaestroHooksConfigStub } from '../../contracts/questmaestro-hooks-config/questmaestro-hooks-config.stub';

describe('isQuestmaestroHooksConfigGuard', () => {
  describe('valid input', () => {
    it('VALID: {valid config} => returns true', () => {
      const config = QuestmaestroHooksConfigStub();

      const result = isQuestmaestroHooksConfigGuard(config);

      expect(result).toBe(true);
    });

    it('VALID: {config with preEditLint} => returns true', () => {
      const config = QuestmaestroHooksConfigStub({
        preEditLint: { rules: ['custom-rule'] },
      });

      const result = isQuestmaestroHooksConfigGuard(config);

      expect(result).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {null} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard(null);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {undefined} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard(undefined);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {string} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard('not a config');

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {number} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard(123);

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {object without preEditLint} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard({ other: 'property' });

      expect(result).toBe(false);
    });

    it('INVALID_VALUE: {array} => returns false', () => {
      const result = isQuestmaestroHooksConfigGuard([]);

      expect(result).toBe(false);
    });
  });
});
