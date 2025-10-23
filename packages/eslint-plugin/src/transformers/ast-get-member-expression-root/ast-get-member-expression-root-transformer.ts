import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@questmaestro/shared/contracts';

/**
 * Extracts the root object name from a member expression chain.
 * Traverses up the member expression chain until reaching the root Identifier.
 *
 * @returns The root object name, or null if not found
 * @example
 * // obj.prop.nested => 'obj'
 * // result.files => 'result'
 * // result.user.name => 'result'
 * // obj?.prop => 'obj'
 */
export const astGetMemberExpressionRootTransformer = ({
  expr,
}: {
  expr?: Tsestree;
}): Identifier | null => {
  let current: Tsestree | null | undefined = expr;

  // Traverse up the member expression chain
  while (current !== null && current !== undefined && current.type === 'MemberExpression') {
    current = current.object;
  }

  // At the root, should be an Identifier
  if (
    current !== null &&
    current !== undefined &&
    current.type === 'Identifier' &&
    typeof current.name === 'string'
  ) {
    return identifierContract.parse(current.name);
  }

  return null;
};
