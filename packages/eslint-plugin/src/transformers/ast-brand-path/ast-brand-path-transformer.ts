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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { isAstMethodCallGuard } from '../../guards/is-ast-method-call/is-ast-method-call-guard';

export const astBrandPathTransformer = ({ node }: { node: Tsestree }): Identifier[] => {
  const path: Identifier[] = [];
  let current: Tsestree = node;
  let { parent } = current;

  while (parent) {
    if (parent.type === 'Property') {
      const { key } = parent;
      const keyText = key?.type === 'Identifier' ? key.name : key?.value;
      if (typeof keyText === 'string') {
        path.unshift(identifierContract.parse(keyText));
      }
    }

    const isKeyedCall =
      isAstMethodCallGuard({ node: parent, object: 'z', method: 'record' }) ||
      isAstMethodCallGuard({ node: parent, object: 'z', method: 'map' });
    if (isKeyedCall && parent.arguments?.[0] === current) {
      path.unshift(identifierContract.parse('Key'));
    }

    const tupleCall = parent.parent ?? null;
    if (
      parent.type === 'ArrayExpression' &&
      tupleCall !== null &&
      isAstMethodCallGuard({ node: tupleCall, object: 'z', method: 'tuple' })
    ) {
      const index = parent.elements?.indexOf(current) ?? -1;
      if (index >= 0) {
        path.unshift(identifierContract.parse(String(index)));
      }
    }

    if (parent.type === 'VariableDeclarator') {
      if (parent.id?.type === 'Identifier' && parent.id.name !== undefined) {
        path.unshift(parent.id.name);
      }
      return path;
    }

    current = parent;
    ({ parent } = current);
  }

  // No owning const above the node: there is no owner to derive a text from.
  return [];
};
