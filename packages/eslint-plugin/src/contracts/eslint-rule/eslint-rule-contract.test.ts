import { EslintRuleStub } from './eslint-rule.stub';
import { eslintRuleContract } from './eslint-rule-contract';

describe('EslintRuleStub', () => {
  it('VALID: {} => returns default EslintRule', () => {
    eslintRuleContract.safeParse({});
    const result = EslintRuleStub();

    expect(result.meta.type).toBe('problem');
    expect(result.meta.docs.description).toBe('Test rule description');
    expect(typeof result.create).toBe('function');
  });

  it('VALID: {meta: {type: "suggestion"}} => returns EslintRule with custom type', () => {
    const result = EslintRuleStub({
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Custom description',
        },
      },
    });

    expect(result.meta.type).toBe('suggestion');
  });

  it('VALID: {meta: {docs: {category: "Best Practices"}}} => returns EslintRule with custom category', () => {
    const result = EslintRuleStub({
      meta: {
        type: 'problem',
        docs: {
          description: 'Custom description',
          category: 'Best Practices',
        },
      },
    });

    expect(result.meta.docs.category).toBe('Best Practices');
  });

  it('INVALID_TYPE: {meta: {type: "invalid"}} => throws ZodError', () => {
    expect(() => {
      EslintRuleStub({
        meta: {
          type: 'invalid' as never,
          docs: {
            description: 'Test',
          },
        },
      });
    }).toThrow('Invalid enum value');
  });

  it('INVALID_DESCRIPTION: {meta: {docs: {description: ""}}} => throws ZodError', () => {
    expect(() => {
      EslintRuleStub({
        meta: {
          type: 'problem',
          docs: {
            description: '',
          },
        },
      });
    }).toThrow('String must contain at least 1 character(s)');
  });
});
