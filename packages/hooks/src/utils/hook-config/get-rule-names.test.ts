import { getRuleNames } from './get-rule-names';
import type { PreEditLintConfig } from '../../types/config-type';

describe('getRuleNames', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["rule1", "rule2"]}} => returns string array', () => {
      const config: PreEditLintConfig = {
        rules: ['rule1', 'rule2'],
      };

      const result = getRuleNames({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });

    it('VALID: {config: {rules: [{rule: "rule1"}, {rule: "rule2"}]}} => returns rule names', () => {
      const config: PreEditLintConfig = {
        rules: [
          { rule: 'rule1', displayName: 'Rule 1' },
          { rule: 'rule2', message: 'Custom message' },
        ],
      };

      const result = getRuleNames({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });

    it('VALID: {config: {rules: ["rule1", {rule: "rule2"}]}} => returns mixed rule names', () => {
      const config: PreEditLintConfig = {
        rules: ['rule1', { rule: 'rule2', displayName: 'Rule 2' }],
      };

      const result = getRuleNames({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {rules: []}} => returns empty array', () => {
      const config: PreEditLintConfig = {
        rules: [],
      };

      const result = getRuleNames({ config });

      expect(result).toStrictEqual([]);
    });
  });
});
