/**
 * PURPOSE: Tells whether a `registerSpyOn({ object, method })` names one of the void sinks a proxy
 * may record with `calledWith([])`: `process.stdout` or `process.stderr` with `write`, or `process`
 * with `on`, or a bare `stderr`/`stdout` the file imported from `#gateway/node/process` with `write`.
 * Matched by the object's member-expression text, the imported local names and the method's string,
 * never by type and never by a bare `stderr` name alone.
 *
 * USAGE:
 * voidSinkSpyLayerBroker({ objectNode, method: 'write', gatewaySinkNames });
 * // true for `process.stderr` + 'write', false for `socket` + 'write' or `process` + 'write'
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

export const voidSinkSpyLayerBroker = ({
  objectNode,
  method,
  gatewaySinkNames,
}: {
  objectNode: unknown;
  method: string;
  gatewaySinkNames: ReadonlySet<Identifier>;
}): boolean => {
  // `parent` makes a real node cyclic, so it is read structurally
  const node = objectNode as TSESTree.Node;

  if (node.type === AST_NODE_TYPES.Identifier) {
    return (
      (node.name === 'process' && method === 'on') ||
      (method === 'write' && gatewaySinkNames.has(identifierContract.parse(node.name)))
    );
  }

  return (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.object.name === 'process' &&
    node.property.type === AST_NODE_TYPES.Identifier &&
    (node.property.name === 'stdout' || node.property.name === 'stderr') &&
    method === 'write'
  );
};
