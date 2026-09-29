/**
 * PURPOSE: Reads the path B3 derives a brand text from: the const that owns the schema, then every
 * key between it and the given node. A `z.record` key adds `Key` and a `z.tuple` position adds its
 * index, so `counts: z.record(z.string(), …)` reads `['questContract', 'counts', 'Key']`. Walks up
 * the parent chain, so it works on a node the rule is visiting and needs no other file. Empty when no
 * const owns the node.
 *
 * USAGE:
 * astBrandPathTransformer({ node: brandCallInsideQuestContractId });
 * // Returns ['questContract', 'id']
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstMethodCallGuard } from '../../guards/is-ast-method-call/is-ast-method-call-guard';

export const astBrandPathTransformer = ({ node }: { node: TSESTree.Node }): Identifier[] => {
  const path: Identifier[] = [];
  let current: TSESTree.Node = node;
  let { parent } = current;

  while (parent) {
    if (parent.type === AST_NODE_TYPES.Property) {
      const { key } = parent;
      const keyText =
        key.type === AST_NODE_TYPES.Identifier
          ? key.name
          : key.type === AST_NODE_TYPES.Literal
            ? key.value
            : undefined;
      if (typeof keyText === 'string') {
        path.unshift(identifierContract.parse(keyText));
      }
    }

    const isKeyedCall =
      isAstMethodCallGuard({ node: parent, object: 'z', method: 'record' }) ||
      isAstMethodCallGuard({ node: parent, object: 'z', method: 'map' });
    if (
      isKeyedCall &&
      (parent.type === AST_NODE_TYPES.CallExpression || parent.type === AST_NODE_TYPES.NewExpression
        ? parent.arguments[0]
        : undefined) === current
    ) {
      path.unshift(identifierContract.parse('Key'));
    }

    const tupleCall = parent.parent ?? null;
    if (
      parent.type === AST_NODE_TYPES.ArrayExpression &&
      tupleCall !== null &&
      isAstMethodCallGuard({ node: tupleCall, object: 'z', method: 'tuple' })
    ) {
      const child = current;
      const index = parent.elements.findIndex((element) => element === child);
      if (index >= 0) {
        path.unshift(identifierContract.parse(String(index)));
      }
    }

    if (parent.type === AST_NODE_TYPES.VariableDeclarator) {
      if (parent.id.type === AST_NODE_TYPES.Identifier) {
        path.unshift(identifierContract.parse(parent.id.name));
      }
      return path;
    }

    current = parent;
    ({ parent } = current);
  }

  // No owning const above the node: there is no owner to derive a text from.
  return [];
};
