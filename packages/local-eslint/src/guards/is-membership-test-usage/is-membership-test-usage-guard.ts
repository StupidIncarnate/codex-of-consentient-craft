/**
 * PURPOSE: Separates a collection of package names that DECIDES something from one that is merely a
 * list. `['web', 'app'].includes(pkg)` is the same branch `pkg === 'web'` makes with the operands
 * moved, while the identical array handed to `map` or persisted as a tag list decides nothing — so
 * the no-hardcoded-package-names rule consults this before reporting names that carry no path
 * around them and sit in no comparison.
 *
 * USAGE:
 * isMembershipTestUsageGuard({ node });
 * // Returns true when node is the receiver of `.includes(...)` or the argument of `new Set(...)`
 *
 * WHEN-TO-USE: Only inside the no-hardcoded-package-names rule broker. Reach for
 * `isPackageNameComparisonOperandGuard` instead when the node is one bare name rather than the
 * collection holding it.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';
import { effectiveExpressionParentTransformer } from '../../transformers/effective-expression-parent/effective-expression-parent-transformer';

export const isMembershipTestUsageGuard = ({ node }: { node?: TSESTree.Node | null }): boolean => {
  if (node === null || node === undefined) {
    return false;
  }

  const parent = effectiveExpressionParentTransformer({ node });

  if (parent === null) {
    return false;
  }

  if (parent.type === AST_NODE_TYPES.MemberExpression) {
    const propertyName =
      parent.property.type === AST_NODE_TYPES.Identifier
        ? parent.property.name
        : String(
            parent.property.type === AST_NODE_TYPES.Literal ? parent.property.value : undefined,
          );
    // A MemberExpression has exactly two children — the receiver and the property — so a node
    // carrying the method's own name IS the property, not the collection being tested.
    const nodeIsTheProperty = node.type === AST_NODE_TYPES.Identifier && node.name === propertyName;

    return (
      !nodeIsTheProperty &&
      packageNameLiteralStatics.membershipTestMethodNames.some((method) => method === propertyName)
    );
  }

  if (parent.type === AST_NODE_TYPES.NewExpression) {
    const calleeName = parent.callee.type === AST_NODE_TYPES.Identifier ? parent.callee.name : '';
    const nodeIsTheCallee = node.type === AST_NODE_TYPES.Identifier && node.name === calleeName;

    return (
      !nodeIsTheCallee &&
      packageNameLiteralStatics.membershipSetConstructorNames.some((name) => name === calleeName)
    );
  }

  return false;
};
