import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { isPackageNameComparisonOperandGuard } from './is-package-name-comparison-operand-guard';

describe('isPackageNameComparisonOperandGuard', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isPackageNameComparisonOperandGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(isPackageNameComparisonOperandGuard({ node: null })).toBe(false);
    });

    it('EMPTY: {node: Literal in a bare expression statement} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: LiteralStub({ code: '"web";' }),
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
            node: LiteralStub({ code: `"web" ${operator} b;` }),
          }),
        ).toBe(true);
      },
    );

    it('VALID: {node: SwitchCase test} => returns true', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: LiteralStub({ code: 'switch (x) { case "server": break; }' }),
        }),
      ).toBe(true);
    });
  });

  describe('data positions', () => {
    it('VALID: {node: array member} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: LiteralStub({ code: 'const a = ["web"];' }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: object property value} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: LiteralStub({ code: 'const o = { a: "web" };' }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: operand of a non-equality binary operator} => returns false', () => {
      expect(
        isPackageNameComparisonOperandGuard({
          node: LiteralStub({ code: '"web" + b' }),
        }),
      ).toBe(false);
    });
  });
});
