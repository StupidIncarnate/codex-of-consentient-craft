/**
 * PURPOSE: Finds where a leaf's brand goes: after the leaf call and every check chained onto it
 * (`.min(1)`, `.uuid()`), and before the first wrapper such as `.optional()` or `.array()`, so the
 * brand sits on the string or number and not on the wrapper. Reach for this over the object anchor:
 * an object brand goes after shape-level methods, a leaf brand after checks.
 *
 * USAGE:
 * astLeafBrandAnchorTransformer({ node: zStringCall });
 * // Returns the `z.string().min(1)` call for `z.string().min(1).optional()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const astLeafBrandAnchorTransformer = ({ node }: { node: TSESTree.Node }): TSESTree.Node => {
  let anchor: TSESTree.Node = node;
  let { parent } = anchor;

  while (
    parent?.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === anchor &&
    parent.parent.type === AST_NODE_TYPES.CallExpression &&
    parent.parent.callee === parent
  ) {
    const method = parent.property.type === AST_NODE_TYPES.Identifier ? parent.property.name : '';
    if (zodObjectBrandStatics.leafWrapperMethods.some((wrapper) => wrapper === method)) {
      break;
    }
    anchor = parent.parent;
    ({ parent } = anchor);
  }

  return anchor;
};
