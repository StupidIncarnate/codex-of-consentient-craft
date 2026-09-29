/**
 * PURPOSE: True for a call that makes a new object schema in a contract: `z.object`,
 * `z.strictObject` or `z.looseObject`, or a `.pick`, `.omit`, `.extend`, `.partial` and the like on
 * another contract, since zod v4 drops the brand on each of those and the result is a new object.
 *
 * USAGE:
 * isAstObjectSchemaGuard({ node: callNodeForZObject });
 * // Returns true for `z.object({})` and `userContract.pick({})`, false for `z.string()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';
import { isAstMethodCallGuard } from '../is-ast-method-call/is-ast-method-call-guard';

export const isAstObjectSchemaGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
  if (
    node?.type !== AST_NODE_TYPES.CallExpression ||
    node.callee.type !== AST_NODE_TYPES.MemberExpression
  ) {
    return false;
  }

  const { object: receiver, property } = node.callee;
  const method = property.type === AST_NODE_TYPES.Identifier ? property.name : undefined;
  const isDeriveOnContract =
    receiver.type === AST_NODE_TYPES.Identifier &&
    receiver.name.endsWith('Contract') &&
    zodObjectBrandStatics.deriveMethods.some((derive) => derive === method);

  return (
    isDeriveOnContract ||
    zodObjectBrandStatics.objectRoots.some((root) =>
      isAstMethodCallGuard({ node, object: 'z', method: root }),
    )
  );
};
