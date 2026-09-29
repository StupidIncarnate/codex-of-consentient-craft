/**
 * PURPOSE: True for a call that adds a check to a reused field, `owner.shape.key.min(5)`. A reuse
 * keeps its source's checks and brand, so anything chained on it beyond `.optional()`,
 * `.nullable()`, `.nullish()` and `.default()` makes two checks share one brand text.
 *
 * USAGE:
 * isAstShapeReuseCheckGuard({ node: callNodeForUserContractShapeIdMin });
 * // Returns true for `userContract.shape.id.min(5)`, false for `userContract.shape.id.optional()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const isAstShapeReuseCheckGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
  if (
    node?.type !== AST_NODE_TYPES.CallExpression ||
    node.callee.type !== AST_NODE_TYPES.MemberExpression
  ) {
    return false;
  }

  const { callee } = node;
  const method =
    callee.property.type === AST_NODE_TYPES.Identifier ? callee.property.name : undefined;
  const reused = callee.object;

  return (
    method !== undefined &&
    reused.type === AST_NODE_TYPES.MemberExpression &&
    reused.object.type === AST_NODE_TYPES.MemberExpression &&
    'name' in reused.object.property &&
    reused.object.property.name === 'shape' &&
    !zodObjectBrandStatics.reuseModifiers.some((modifier) => modifier === method)
  );
};
