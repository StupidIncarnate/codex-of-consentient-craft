import type { Rule } from 'eslint';
import { requireZodOnPrimitivesRuleBroker } from './require-zod-on-primitives-rule-broker';
import { astNodeContract } from '../../../contracts/ast-node/ast-node-contract';
import { z } from 'zod';

describe('requireZodOnPrimitivesRuleBroker', () => {
  describe('create()', () => {
    it('VALID: => returns ESLint rule object', () => {
      const rule = requireZodOnPrimitivesRuleBroker();
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      expect(rule).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: ruleDescriptionContract.parse(
              'Require .brand() chaining on z.string() and z.number() calls',
            ),
          },
          messages: {
            requireBrandString:
              "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
            requireBrandNumber:
              "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
          },
          schema: [],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: rule.create() => returns visitor object with string and number selectors', () => {
      const rule = requireZodOnPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;

      const visitor = rule.create(mockContext);
      const keys = Object.keys(visitor);

      expect(keys).toContain(
        'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))',
      );
      expect(keys).toContain(
        'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))',
      );
    });

    it('VALID: z.string() without .brand() => reports string branding violation', () => {
      const rule = requireZodOnPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'CallExpression',
        range: [0, 10] as [number, number],
      });

      visitor[
        'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))'
      ]?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'requireBrandString',
      });
    });

    it('VALID: z.number() without .brand() => reports number branding violation', () => {
      const rule = requireZodOnPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'CallExpression',
        range: [0, 10] as [number, number],
      });

      visitor[
        'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))'
      ]?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'requireBrandNumber',
      });
    });
  });
});
