/**
 * PURPOSE: True for a node in the key schema of a `z.record` (or `z.partialRecord`, `z.looseRecord`,
 * `z.map`): the key's call itself or any call chained onto it. A record's or map's keys stay plain,
 * because a branded key fails every lookup by a plain string, and a key that is an owner's id reuses
 * that owner's field. So the brand rules neither demand nor grade a brand there.
 *
 * USAGE:
 * isAstRecordKeyGuard({ node: callNodeForZStringInsideRecordKey });
 * // Returns true for the `z.string()` in `z.record(z.string(), z.number())`, false for the `z.number()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstMethodCallGuard } from '../is-ast-method-call/is-ast-method-call-guard';

export const isAstRecordKeyGuard = ({ node }: { node?: TSESTree.Node | undefined }): boolean => {
  if (node === undefined) {
    return false;
  }

  let top: TSESTree.Node = node;
  let { parent } = top;
  while (
    parent?.type === AST_NODE_TYPES.MemberExpression &&
    parent.object === top &&
    parent.parent.type === AST_NODE_TYPES.CallExpression &&
    parent.parent.callee === parent
  ) {
    top = parent.parent;
    ({ parent } = top);
  }

  const key = top;
  return (
    parent?.type === AST_NODE_TYPES.CallExpression &&
    parent.arguments[0] === key &&
    ['record', 'partialRecord', 'looseRecord', 'map'].some((method) =>
      isAstMethodCallGuard({ node: parent, object: 'z', method }),
    )
  );
};
