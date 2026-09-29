/**
 * PURPOSE: Tells whether a type node is, or contains, an object type literal with at least one
 * member that is not a function. Such a shape is data another function receives, so it belongs in
 * a contract; an object type whose every member is a function is a method set and stays inline.
 * Looks through unions, intersections, arrays, `readonly` and type arguments (`Promise<{ ok: boolean }>`),
 * and never into a function type, so `() => { a: string }` stays alone.
 *
 * USAGE:
 * hasDataObjectLiteralTypeGuard({ node: returnTypeAnnotation });
 * // Returns true for `{ camel: string }` and `Promise<{ removed: boolean }>`, false for
 * // `{ stop: () => void }` and `Quest['id']`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFunctionTypeNodeGuard } from '../is-function-type-node/is-function-type-node-guard';

export const hasDataObjectLiteralTypeGuard = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => {
  if (node === undefined || node === null) {
    return false;
  }

  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return node.members.some((member) => !isFunctionTypeNodeGuard({ node: member }));
  }

  if (node.type === AST_NODE_TYPES.TSUnionType || node.type === AST_NODE_TYPES.TSIntersectionType) {
    return node.types.some((member) => hasDataObjectLiteralTypeGuard({ node: member }));
  }

  if (node.type === AST_NODE_TYPES.TSArrayType) {
    return hasDataObjectLiteralTypeGuard({ node: node.elementType });
  }

  if (
    node.type === AST_NODE_TYPES.TSTypeAnnotation ||
    node.type === AST_NODE_TYPES.TSTypeOperator
  ) {
    return hasDataObjectLiteralTypeGuard({ node: node.typeAnnotation });
  }

  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    return hasDataObjectLiteralTypeGuard({ node: node.typeArguments });
  }

  if (node.type === AST_NODE_TYPES.TSTypeParameterInstantiation) {
    return node.params.some((param) => hasDataObjectLiteralTypeGuard({ node: param }));
  }

  return false;
};
