/**
 * PURPOSE: Tells whether a type node, or an object-type member, is a function: a function type, a
 * method or call signature, or a property whose type is one (optional included, so `f?: () => void`
 * and `f: (() => void) | undefined` count). Zod has no schema for a function, so a member this
 * accepts is never data. A property typed by a NAMED type (`send: SendFn`) is not decided here —
 * a syntax-only rule cannot see what the name resolves to — so it reads as data.
 *
 * USAGE:
 * isFunctionTypeNodeGuard({ node: memberOfObjectTypeLiteral });
 * // Returns true for `send: (data: string) => void` and `stop(): void`, false for `count: number`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isFunctionTypeNodeGuard = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): boolean => {
  if (node === undefined || node === null) {
    return false;
  }

  if (
    node.type === AST_NODE_TYPES.TSFunctionType ||
    node.type === AST_NODE_TYPES.TSMethodSignature ||
    node.type === AST_NODE_TYPES.TSCallSignatureDeclaration ||
    node.type === AST_NODE_TYPES.TSConstructSignatureDeclaration
  ) {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.TSPropertySignature ||
    node.type === AST_NODE_TYPES.TSTypeAnnotation
  ) {
    return isFunctionTypeNodeGuard({ node: node.typeAnnotation });
  }

  if (node.type === AST_NODE_TYPES.TSUnionType) {
    const members = node.types;

    return (
      members.some((member) => isFunctionTypeNodeGuard({ node: member })) &&
      members.every(
        (member) =>
          member.type === AST_NODE_TYPES.TSUndefinedKeyword ||
          member.type === AST_NODE_TYPES.TSNullKeyword ||
          isFunctionTypeNodeGuard({ node: member }),
      )
    );
  }

  return false;
};
