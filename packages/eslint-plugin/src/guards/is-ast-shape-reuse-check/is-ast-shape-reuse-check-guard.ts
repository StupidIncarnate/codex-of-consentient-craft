/**
 * PURPOSE: True for a call that adds a check to a reused field, `owner.shape.key.min(5)`. A reuse
 * keeps its source's checks and brand, so anything chained on it beyond `.optional()`,
 * `.nullable()`, `.nullish()` and `.default()` makes two checks share one brand text.
 *
 * USAGE:
 * isAstShapeReuseCheckGuard({ node: callNodeForUserContractShapeIdMin });
 * // Returns true for `userContract.shape.id.min(5)`, false for `userContract.shape.id.optional()`
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const isAstShapeReuseCheckGuard = ({ node }: { node?: Tsestree }): boolean => {
  const callee = node?.callee;
  if (node?.type !== 'CallExpression' || callee?.type !== 'MemberExpression') {
    return false;
  }

  const method = callee.property?.type === 'Identifier' ? callee.property.name : undefined;
  const reused = callee.object;

  return (
    method !== undefined &&
    reused?.type === 'MemberExpression' &&
    reused.object?.type === 'MemberExpression' &&
    reused.object.property?.name === 'shape' &&
    !zodObjectBrandStatics.reuseModifiers.some((modifier) => modifier === method)
  );
};
