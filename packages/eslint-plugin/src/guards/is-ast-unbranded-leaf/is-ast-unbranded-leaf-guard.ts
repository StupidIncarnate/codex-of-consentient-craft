/**
 * PURPOSE: True for a `z.string()` or `z.number()` chain (or a v4 format such as `z.uuid()`) that sits
 * where a contract's value lives and carries no `.brand()` anywhere in its chain: a property of a
 * `z.object`, an element of `z.array` or `z.set`, a key or value of `z.record` or `z.map`, or a
 * position of `z.tuple`. Reach for this to find the leaves that need a brand; a leaf passed to
 * `z.union` or held in a local const is not a field of an object contract and is left alone.
 *
 * USAGE:
 * isAstUnbrandedLeafGuard({ node: callNodeForZString });
 * // Returns true for the `z.string()` in `{ title: z.string().min(1) }`, false when `.brand<'…'>()` follows
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { zodObjectBrandStatics } from '../../statics/zod-object-brand/zod-object-brand-statics';
import { isAstMethodCallGuard } from '../is-ast-method-call/is-ast-method-call-guard';

export const isAstUnbrandedLeafGuard = ({
  node,
}: {
  node?: TSESTree.Node | undefined;
}): boolean => {
  if (
    node?.type !== AST_NODE_TYPES.CallExpression ||
    !zodObjectBrandStatics.leafRoots.some((root) =>
      isAstMethodCallGuard({ node, object: 'z', method: root }),
    )
  ) {
    return false;
  }

  let top: TSESTree.Node = node;
  let { parent } = top;
  while (
    parent.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === top &&
    parent.parent.type === AST_NODE_TYPES.CallExpression &&
    parent.parent.callee === parent
  ) {
    if (parent.property.type === AST_NODE_TYPES.Identifier && parent.property.name === 'brand') {
      return false;
    }
    top = parent.parent;
    ({ parent } = top);
  }

  if (parent.type === AST_NODE_TYPES.Property && parent.value === top) {
    const shape = parent.parent;
    const owner = shape.parent;
    const ownerMethod =
      owner.type === AST_NODE_TYPES.CallExpression &&
      owner.arguments[0] === shape &&
      owner.callee.type === AST_NODE_TYPES.MemberExpression &&
      owner.callee.property.type === AST_NODE_TYPES.Identifier
        ? owner.callee.property.name
        : undefined;
    return [...zodObjectBrandStatics.objectRoots, ...zodObjectBrandStatics.deriveMethods].some(
      (method) => method === ownerMethod,
    );
  }

  if (parent.type === AST_NODE_TYPES.ArrayExpression) {
    const tuple = parent.parent;
    return (
      tuple.type === AST_NODE_TYPES.CallExpression &&
      tuple.arguments[0] === parent &&
      isAstMethodCallGuard({ node: tuple, object: 'z', method: 'tuple' })
    );
  }

  const child = top;
  return (
    parent.type === AST_NODE_TYPES.CallExpression &&
    parent.arguments.some((argument) => argument === child) &&
    ['array', 'set', 'record', 'map'].some((method) =>
      isAstMethodCallGuard({ node: parent, object: 'z', method }),
    )
  );
};
