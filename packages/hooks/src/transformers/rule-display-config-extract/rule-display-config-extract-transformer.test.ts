import { ruleDisplayConfigExtractTransformer } from './rule-display-config-extract-transformer';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';

describe('ruleDisplayConfigExtractTransformer', () => {
  describe('valid input', () => {
    it('VALID: {config: with object rule, ruleId: "test-rule"} => returns display config', () => {
      const config = PreEditLintConfigStub({
        rules: [
          'string-rule',
          {
            rule: 'test-rule',
            displayName: 'Test Rule',
            message: 'Custom test message',
          },
        ],
      });

      const result = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: 'test-rule',
      });

      expect(result).toStrictEqual({
        displayName: 'Test Rule',
        message: 'Custom test message',
      });
    });

    it('VALID: {config: with partial object rule, ruleId: "partial-rule"} => returns partial config', () => {
      const config = PreEditLintConfigStub({
        rules: [
          {
            rule: 'partial-rule',
            displayName: 'Partial Rule',
          },
        ],
      });

      const result = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: 'partial-rule',
      });

      expect(result).toStrictEqual({
        displayName: 'Partial Rule',
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: with string rules only, ruleId: "string-rule"} => returns empty object', () => {
      const config = PreEditLintConfigStub({
        rules: ['string-rule', 'another-rule'],
      });

      const result = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: 'string-rule',
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {config: with rules, ruleId: "nonexistent"} => returns empty object', () => {
      const config = PreEditLintConfigStub({
        rules: ['string-rule', { rule: 'object-rule', displayName: 'Object Rule' }],
      });

      const result = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: 'nonexistent',
      });

      expect(result).toStrictEqual({});
    });

    it('EDGE: {config: {rules: []}, ruleId: "any-rule"} => returns empty object', () => {
      const config = PreEditLintConfigStub({
        rules: [],
      });

      const result = ruleDisplayConfigExtractTransformer({
        config,
        ruleId: 'any-rule',
      });

      expect(result).toStrictEqual({});
    });
  });
});
