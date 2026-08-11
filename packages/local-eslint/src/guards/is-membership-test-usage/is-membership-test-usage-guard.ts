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
import type { Tsestree } from '@dungeonmaster/eslint-plugin';

import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';
import { effectiveExpressionParentTransformer } from '../../transformers/effective-expression-parent/effective-expression-parent-transformer';

export const isMembershipTestUsageGuard = ({ node }: { node?: Tsestree | null }): boolean => {
  if (node === null || node === undefined) {
    return false;
  }

  const parent = effectiveExpressionParentTransformer({ node });

  if (parent === null) {
    return false;
  }

  if (parent.type === 'MemberExpression') {
    const propertyName =
      parent.property?.type === 'Identifier'
        ? String(parent.property.name)
        : String(parent.property?.value);
    // A MemberExpression has exactly two children — the receiver and the property — so a node
    // carrying the method's own name IS the property, not the collection being tested.
    const nodeIsTheProperty = node.type === 'Identifier' && String(node.name) === propertyName;

    return (
      !nodeIsTheProperty &&
      packageNameLiteralStatics.membershipTestMethodNames.some((method) => method === propertyName)
    );
  }

  if (parent.type === 'NewExpression') {
    const calleeName = parent.callee?.type === 'Identifier' ? String(parent.callee.name) : '';
    const nodeIsTheCallee = node.type === 'Identifier' && String(node.name) === calleeName;

    return (
      !nodeIsTheCallee &&
      packageNameLiteralStatics.membershipSetConstructorNames.some((name) => name === calleeName)
    );
  }

  return false;
};
