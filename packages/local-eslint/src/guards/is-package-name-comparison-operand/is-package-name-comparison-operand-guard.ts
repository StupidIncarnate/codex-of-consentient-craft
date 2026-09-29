/**
 * PURPOSE: Separates a bare package name that DECIDES something ON ITS OWN from one that is merely data. The same literal `'web'` is a branch as an equality operand or a switch case, and is nothing at all as an enum option or a display label — so the no-hardcoded-package-names rule consults this before reporting a name that carries no path around it.
 *
 * USAGE:
 * isPackageNameComparisonOperandGuard({ node });
 * // Returns true when node sits under `x === 'web'` or `case 'web':`
 *
 * WHEN-TO-USE: Only inside the no-hardcoded-package-names rule broker. Reach for `isMembershipTestUsageGuard` instead when the decision is made by the COLLECTION a name sits in rather than by the name itself — a bare name in an array literal decides nothing until something tests membership against that array.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';

export const isPackageNameComparisonOperandGuard = ({
  node,
}: {
  node?: TSESTree.Node | null;
}): boolean => {
  const parent = node?.parent;

  if (!parent) {
    return false;
  }

  if (parent.type === AST_NODE_TYPES.SwitchCase) {
    // A string literal can only be the discriminant test of a case — the consequent holds
    // statements, whose own literals hang off an ExpressionStatement instead.
    return true;
  }

  if (parent.type !== AST_NODE_TYPES.BinaryExpression) {
    return false;
  }

  return packageNameLiteralStatics.equalityOperators.some(
    (operator) => operator === parent.operator,
  );
};
