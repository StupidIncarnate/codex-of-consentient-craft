import { ruleNamesExtractTransformer } from './rule-names-extract-transformer';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';

describe('ruleNamesExtractTransformer', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["rule1", "rule2"]}} => returns string array', () => {
      const config = PreEditLintConfigStub({
        rules: ['rule1', 'rule2'],
      });

      const result = ruleNamesExtractTransformer({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });

    it('VALID: {config: {rules: [{rule: "rule1"}, {rule: "rule2"}]}} => returns rule names', () => {
      const config = PreEditLintConfigStub({
        rules: [
          { rule: 'rule1', displayName: 'Rule 1' },
          { rule: 'rule2', message: 'Custom message' },
        ],
      });

      const result = ruleNamesExtractTransformer({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });

    it('VALID: {config: {rules: ["rule1", {rule: "rule2"}]}} => returns mixed rule names', () => {
      const config = PreEditLintConfigStub({
        rules: ['rule1', { rule: 'rule2', displayName: 'Rule 2' }],
      });

      const result = ruleNamesExtractTransformer({ config });

      expect(result).toStrictEqual(['rule1', 'rule2']);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {rules: []}} => returns empty array', () => {
      const config = PreEditLintConfigStub({
        rules: [],
      });

      const result = ruleNamesExtractTransformer({ config });

      expect(result).toStrictEqual([]);
    });
  });
});
