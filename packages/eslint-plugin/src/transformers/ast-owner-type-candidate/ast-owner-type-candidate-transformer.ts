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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astOwnerTypeCandidateTransformer = ({
  typeNode,
}: {
  typeNode: Tsestree;
}): Tsestree | null => {
  const members = typeNode.type === 'TSUnionType' ? (typeNode.types ?? []) : [typeNode];

  return (
    members.find(
      (member) =>
        member.type === 'TSStringKeyword' ||
        (member.type === 'TSTypeReference' && member.typeName?.type === 'Identifier'),
    ) ?? null
  );
};
