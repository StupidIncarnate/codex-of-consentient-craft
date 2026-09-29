/**
 * PURPOSE: Finds where an object schema's brand goes: right after the object call and the last
 * shape-level method chained onto it (`.extend`, `.strict`), and before any wrapper such as
 * `.optional()`, so the brand sits on the object and not on the wrapper. Returns null when the chain
 * already carries a brand, so a caller reports only the objects that lack one.
 *
 * USAGE:
 * astObjectBrandAnchorTransformer({ node: zObjectCall });
 * // Returns the `z.object({ … }).strict()` call for `z.object({ … }).strict().optional()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';

export const astObjectBrandAnchorTransformer = ({
  node,
}: {
  node: TSESTree.Node;
}): TSESTree.Node | null => {
  let anchor: TSESTree.Node = node;
  let current: TSESTree.Node = node;
  let inShapeRun = true;
  let { parent } = current;

  while (parent?.type === AST_NODE_TYPES.MemberExpression && parent.object === current) {
    const call = parent.parent;
    if (call.type !== AST_NODE_TYPES.CallExpression || call.callee !== parent) {
      break;
    }

    const method =
      parent.property.type === AST_NODE_TYPES.Identifier ? parent.property.name : undefined;
    if (method === 'brand') {
      return null;
    }

    if (inShapeRun && zodObjectBrandStatics.objectLevelMethods.some((level) => level === method)) {
      anchor = call;
    } else {
      inShapeRun = false;
    }

    current = call;
    ({ parent } = current);
  }

  return anchor;
};
