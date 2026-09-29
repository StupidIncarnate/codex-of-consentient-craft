/**
 * PURPOSE: Names the method a call is made on: `brand` for `z.string().brand<'X'>()`, `pick` for
 * `userContract.pick({})`. Null for a call on a bare function, or on anything but a member access.
 *
 * USAGE:
 * astCallMethodNameTransformer({ node: callNode });
 * // Returns 'brand' for `z.string().brand<'X'>()`
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astCallMethodNameTransformer = ({ node }: { node: Tsestree }): Identifier | null => {
  const { callee } = node;

  return callee?.type === 'MemberExpression' && callee.property?.type === 'Identifier'
    ? (callee.property.name ?? null)
    : null;
};
