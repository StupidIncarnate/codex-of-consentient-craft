import { eslintRuleContract } from './eslint-rule-contract';
import { z } from 'zod';

describe('eslintRuleContract', () => {
  describe('parse()', () => {
    it('VALID: {meta: {type: "problem", docs: {description: "test"}}, create: function} => returns EslintRule', () => {
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      const validRule = {
        meta: {
          type: 'problem' as const,
          docs: {
            description: ruleDescriptionContract.parse('Test rule description'),
          },
        },
        create: () => {
          return {};
        },
      };

      const result = eslintRuleContract.parse(validRule);

      expect(result.meta).toStrictEqual(validRule.meta);
      expect(typeof result.create).toBe('function');
    });

    it('VALID: {meta: {type: "suggestion", docs: {description: "test", category: "best-practice"}}, create: function} => returns EslintRule', () => {
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      const validRule = {
        meta: {
          type: 'suggestion' as const,
          docs: {
            description: ruleDescriptionContract.parse('Test suggestion rule'),
            category: 'best-practice',
            recommended: true,
          },
          fixable: 'code' as const,
          schema: [{ type: 'object' }],
          messages: {
            error: 'Error message',
          },
        },
        create: () => {
          return {};
        },
      };

      const result = eslintRuleContract.parse(validRule);

      expect(result.meta).toStrictEqual(validRule.meta);
      expect(typeof result.create).toBe('function');
    });

    it('INVALID_TYPE: {meta: {type: "invalid"}} => throws ZodError', () => {
      const invalidRule = {
        meta: {
          type: 'invalid',
          docs: {
            description: 'Test',
          },
        },
        create: () => {
          return {};
        },
      };

      expect(() => {
        return eslintRuleContract.parse(invalidRule);
      }).toThrow();
    });

    it('INVALID_DESCRIPTION: {meta: {docs: {description: ""}}} => throws ZodError', () => {
      const invalidRule = {
        meta: {
          type: 'problem',
          docs: {
            description: '',
          },
        },
        create: () => {
          return {};
        },
      };

      expect(() => {
        return eslintRuleContract.parse(invalidRule);
      }).toThrow();
    });

    it('EMPTY: {meta: {}} => throws ZodError', () => {
      const invalidRule = {
        meta: {},
        create: () => {
          return {};
        },
      };

      expect(() => {
        return eslintRuleContract.parse(invalidRule);
      }).toThrow();
    });
  });
});
