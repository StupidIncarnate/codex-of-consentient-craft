/**
 * PURPOSE: Picks the part of a written type a fix would replace with `Owner['key']`: the `string`
 * keyword, or a plain type reference (a standalone brand such as `QuestId`), either bare or as a
 * member of a union (`string | undefined` keeps its `undefined`). Any other type, an indexed access
 * included, gives null and is left alone.
 *
 * USAGE:
 * astOwnerTypeCandidateTransformer({ typeNode: unionOfStringAndUndefined });
 * // Returns the `string` node of `string | undefined`; null for `Quest['id']`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astOwnerTypeCandidateTransformer = ({
  typeNode,
}: {
  typeNode: TSESTree.Node;
}): TSESTree.Node | null => {
  const members = typeNode.type === AST_NODE_TYPES.TSUnionType ? typeNode.types : [typeNode];

  return (
    members.find(
      (member) =>
        member.type === AST_NODE_TYPES.TSStringKeyword ||
        (member.type === AST_NODE_TYPES.TSTypeReference &&
          member.typeName.type === AST_NODE_TYPES.Identifier),
    ) ?? null
  );
};
