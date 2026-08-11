/**
 * PURPOSE: Separates a bare package name that DECIDES something from one that is merely data. The same literal `'web'` is a branch as an equality operand or a switch case, and is nothing at all as an enum option, an array member, or a display label — so the no-hardcoded-package-names rule consults this before reporting a name that carries no path around it.
 *
 * USAGE:
 * isPackageNameComparisonOperandGuard({ node });
 * // Returns true when node sits under `x === 'web'` or `case 'web':`
 *
 * WHEN-TO-USE: Only inside the no-hardcoded-package-names rule broker.
 */
import type { Tsestree } from '@dungeonmaster/eslint-plugin';
import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';

export const isPackageNameComparisonOperandGuard = ({
  node,
}: {
  node?: Tsestree | null;
}): boolean => {
  const parent = node?.parent;

  if (parent === null || parent === undefined) {
    return false;
  }

  if (parent.type === 'SwitchCase') {
    // A string literal can only be the discriminant test of a case — the consequent holds
    // statements, whose own literals hang off an ExpressionStatement instead.
    return true;
  }

  if (parent.type !== 'BinaryExpression') {
    return false;
  }

  return packageNameLiteralStatics.equalityOperators.some(
    (operator) => operator === parent.operator,
  );
};
