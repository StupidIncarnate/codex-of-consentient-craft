import { explicitReturnTypesRuleBroker } from './explicit-return-types-rule-broker';
import { astNodeContract } from '../../../contracts/ast-node/ast-node-contract';
import { z } from 'zod';
import { RuleContextStub } from '../../../../test/stubs/rule-context-stub';

describe('explicitReturnTypesRuleBroker', () => {
  describe('create()', () => {
    it('VALID: => returns ESLint rule object', () => {
      const rule = explicitReturnTypesRuleBroker();
      const ruleDescriptionContract = z.string().min(1).brand<'RuleDescription'>();

      expect(rule).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: ruleDescriptionContract.parse(
              'Require explicit return types on exported functions using Zod contracts',
            ),
          },
          messages: {
            missingReturnType:
              'Exported functions must have explicit return types using Zod contracts',
          },
          schema: [],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: rule.create() => returns visitor object with export selectors', () => {
      const rule = explicitReturnTypesRuleBroker();
      const mockContext = RuleContextStub();

      const visitor = rule.create(mockContext);
      const keys = Object.keys(visitor);

      expect(keys).toContain(
        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])',
      );
      expect(keys).toContain('ExportNamedDeclaration > FunctionDeclaration:not([returnType])');
      expect(keys).toContain('ExportDefaultDeclaration > FunctionDeclaration:not([returnType])');
      expect(keys).toContain(
        'ExportDefaultDeclaration > ArrowFunctionExpression:not([returnType])',
      );
    });

    it('VALID: exported arrow function without return type => reports violation', () => {
      const rule = explicitReturnTypesRuleBroker();
      const mockContext = RuleContextStub();
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'ArrowFunctionExpression',
        range: [0, 20] as [number, number],
      });

      visitor[
        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])'
      ]?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'missingReturnType',
      });
    });

    it('VALID: exported function declaration without return type => reports violation', () => {
      const rule = explicitReturnTypesRuleBroker();
      const mockContext = RuleContextStub();
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'FunctionDeclaration',
        range: [0, 30] as [number, number],
      });

      visitor['ExportNamedDeclaration > FunctionDeclaration:not([returnType])']?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'missingReturnType',
      });
    });

    it('VALID: default exported function without return type => reports violation', () => {
      const rule = explicitReturnTypesRuleBroker();
      const mockContext = RuleContextStub();
      const visitor = rule.create(mockContext);
      const mockNode = astNodeContract.parse({
        type: 'FunctionDeclaration',
        range: [0, 40] as [number, number],
      });

      visitor['ExportDefaultDeclaration > FunctionDeclaration:not([returnType])']?.(mockNode);

      expect(mockContext.report).toHaveBeenCalledTimes(1);
      expect(mockContext.report).toHaveBeenCalledWith({
        node: mockNode,
        messageId: 'missingReturnType',
      });
    });
  });
});
