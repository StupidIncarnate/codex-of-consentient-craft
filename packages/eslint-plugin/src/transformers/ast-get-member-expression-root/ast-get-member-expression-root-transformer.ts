/**
 * PURPOSE: Extracts the root object name from a member expression chain
 *
 * USAGE:
 * const root = astGetMemberExpressionRootTransformer({ expr: memberExpressionNode });
 * // Returns 'obj' for obj.prop.nested, 'result' for result.files, or null if not found
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

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
