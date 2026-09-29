/**
 * PURPOSE: Picks the identifier platform-globals-ban should actually resolve through the type
 * checker. `foo.bar` — `bar` is a property label, not a reference, UNLESS the access is computed
 * (`foo[bar]`, where `bar` really is a variable read) or the object is `globalThis`, whose property
 * IS the global the design doc says to check ("globalThis.X counts as X"). Every other identifier
 * (a bare reference, the object side of any member access) passes through unchanged.
 *
 * USAGE:
 * propertyIdentifierToCheckLayerBroker({ node: bareIdentifierNode });
 * // Returns the same node
 * propertyIdentifierToCheckLayerBroker({ node: stdoutPropertyOfProcessDotStdout });
 * // Returns undefined — a property label, not a reference
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const propertyIdentifierToCheckLayerBroker = ({
  node,
}: {
  node: TSESTree.Node;
}): TSESTree.Node | undefined => {
  const { parent } = node;
  if (
    parent?.type !== AST_NODE_TYPES.MemberExpression ||
    parent.property !== node ||
    parent.computed
  ) {
    return node;
  }
  const { object } = parent;
  if (object.type === AST_NODE_TYPES.Identifier && object.name === 'globalThis') {
    return node;
  }
  return undefined;
};
