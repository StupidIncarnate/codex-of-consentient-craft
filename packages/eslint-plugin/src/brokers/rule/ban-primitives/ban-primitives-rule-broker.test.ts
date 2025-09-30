import type { Rule } from 'eslint';
import { banPrimitivesRuleBroker } from './ban-primitives-rule-broker';
import { astNodeContract } from '../../../contracts/ast-node/ast-node-contract';
import { z } from 'zod';

describe('banPrimitivesRuleBroker', () => {
  describe('create()', () => {
    it('VALID: => returns ESLint rule object', () => {
      const rule = banPrimitivesRuleBroker();
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      expect(rule).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: ruleDescriptionContract.parse(
              'Ban raw string and number types in favor of Zod contract types',
            ),
          },
          messages: {
            banPrimitive:
              'Raw {{typeName}} type is not allowed. Use Zod contract types like {{suggestion}} instead.',
          },
          schema: [],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: rule.create() => returns visitor object with TSStringKeyword and TSNumberKeyword', () => {
      const rule = banPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;

      const visitor = rule.create(mockContext);

      expect(visitor).toHaveProperty('TSStringKeyword, TSNumberKeyword');
      expect(typeof visitor['TSStringKeyword, TSNumberKeyword']).toBe('function');
    });

    it('VALID: TSStringKeyword node => reports string type violation', () => {
      const rule = banPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'TSStringKeyword',
        range: [0, 6] as [number, number],
      });

      visitor['TSStringKeyword, TSNumberKeyword']?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'banPrimitive',
        data: {
          typeName: 'string',
          suggestion: 'EmailAddress, UserName, FilePath, etc.',
        },
      });
    });

    it('VALID: TSNumberKeyword node => reports number type violation', () => {
      const rule = banPrimitivesRuleBroker();
      const mockContext = {
        report: jest.fn(),
      } as unknown as Rule.RuleContext;
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'TSNumberKeyword',
        range: [0, 6] as [number, number],
      });

      visitor['TSStringKeyword, TSNumberKeyword']?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'banPrimitive',
        data: {
          typeName: 'number',
          suggestion: 'Currency, PositiveNumber, Age, etc.',
        },
      });
    });
  });
});
