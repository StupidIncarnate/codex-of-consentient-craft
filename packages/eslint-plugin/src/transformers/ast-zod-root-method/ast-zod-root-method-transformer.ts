/**
 * PURPOSE: Names what a zod call chain is built from, so the brand rule can tell an object schema
 * from an enum, a literal or a boolean without reading the chain twice. Returns the method called on
 * `z` (`object`, `string`, `enum`), or `derive` for a chain that goes through `.pick`, `.omit`,
 * `.extend` and the like on another contract, and null when the chain starts anywhere else.
 *
 * USAGE:
 * astZodRootMethodTransformer({ node: callNodeForZStringMinBrand });
 * // Returns 'string'
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';

import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const astZodRootMethodTransformer = ({ node }: { node: TSESTree.Node }): string | null => {
  let current: TSESTree.Node | null | undefined = node;
  let derived = false;

  while (
    current.type === AST_NODE_TYPES.CallExpression &&
    current.callee.type === AST_NODE_TYPES.MemberExpression
  ) {
    const receiver: TSESTree.Node | null | undefined = current.callee.object;
    const { property } = current.callee;
    const method = property.type === AST_NODE_TYPES.Identifier ? property.name : undefined;

    if (receiver.type === AST_NODE_TYPES.Identifier && receiver.name === 'z') {
      return derived || method === undefined ? identifierContract.parse('derive') : method;
    }

    if (zodObjectBrandStatics.deriveMethods.some((derive) => derive === method)) {
      derived = true;
    }

    current = receiver;
  }

  return derived ? identifierContract.parse('derive') : null;
};
