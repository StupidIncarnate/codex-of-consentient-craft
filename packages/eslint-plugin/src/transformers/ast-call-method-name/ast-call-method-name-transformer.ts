/**
 * PURPOSE: Names the method a call is made on: `brand` for `z.string().brand<'X'>()`, `pick` for
 * `userContract.pick({})`. Null for a call on a bare function, or on anything but a member access.
 *
 * USAGE:
 * astCallMethodNameTransformer({ node: callNode });
 * // Returns 'brand' for `z.string().brand<'X'>()`
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astCallMethodNameTransformer = ({
  node,
}: {
  node: TSESTree.CallExpression;
}): Identifier | null => {
  const { callee } = node;

  return callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
    ? identifierContract.parse(callee.property.name)
    : null;
};
