import { isPackageNameComparisonOperandGuard } from './is-package-name-comparison-operand-guard';
import { TsestreeStub, TsestreeNodeType } from '@dungeonmaster/eslint-plugin';

describe('isPackageNameComparisonOperandGuard', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isPackageNameComparisonOperandGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(isPackageNameComparisonOperandGuard({ node: null })).toBe(false);
    });

    it('EMPTY: {node: Literal with no parent} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'web', parent: null }),
        }),
      ).toBe(false);
    });
  });

  describe('branching positions', () => {
    it.each(['===', '!==', '==', '!='] as const)(
      'VALID: {node: operand of %s} => returns true',
      (operator) => {
        expect(
          isPackageNameComparisonOperandGuard({
            node: TsestreeStub({
              type: TsestreeNodeType.Literal,
              value: 'web',
              parent: { type: TsestreeNodeType.BinaryExpression, operator },
            }),
          }),
        ).toBe(true);
      },
    );

    it('VALID: {node: SwitchCase test} => returns true', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Literal,
            value: 'server',
            parent: { type: TsestreeNodeType.SwitchCase },
          }),
        }),
      ).toBe(true);
    });
  });

  describe('data positions', () => {
    it('VALID: {node: array member} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Literal,
            value: 'web',
            parent: { type: TsestreeNodeType.ArrayExpression },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: object property value} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Literal,
            value: 'web',
            parent: { type: TsestreeNodeType.Property },
          }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: operand of a non-equality binary operator} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: TsestreeStub({
            type: TsestreeNodeType.Literal,
            value: 'web',
            parent: { type: TsestreeNodeType.BinaryExpression, operator: '+' },
          }),
        }),
      ).toBe(false);
    });
  });
});
