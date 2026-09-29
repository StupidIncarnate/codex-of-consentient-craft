/**
 * PURPOSE: Tells whether an identifier sits in a type position — `useRef<HTMLDivElement>`, a
 * `Buffer` parameter type, `NodeJS.ErrnoException` (the qualifier `NodeJS` sits in a
 * TSQualifiedName). A type never runs, so platform-globals-ban never checks one. Names the
 * identifier's own parent, never a grandparent, because nothing else can sit directly between an
 * identifier and the type node that names it.
 *
 * USAGE:
 * isTypePositionLayerBroker({ node: typeNameOfTypeReferenceNode });
 * // Returns true
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isTypePositionLayerBroker = ({ node }: { node: TSESTree.Node }): boolean => {
  const parentType = node.parent?.type;
  return (
    parentType === AST_NODE_TYPES.TSTypeReference || parentType === AST_NODE_TYPES.TSQualifiedName
  );
};
