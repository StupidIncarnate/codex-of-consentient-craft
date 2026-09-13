/**
 * PURPOSE: Separates a BUILDER's override bag from a contract taken apart. A block whose members
 * are ALL optional and ALL indexed off the SAME single host is a partial of that host — the caller
 * supplies the fields it wants and the builder fills the rest — so there is no whole object it
 * could have passed instead. Reach for this from ban-flattened-contract-params before reporting;
 * without it, `{ stdout?: MockSpawnResult['stdout']; code?: MockSpawnResult['code'] }` reads as a
 * flattened contract and the only fix the rule would accept destroys the preset it describes.
 *
 * USAGE:
 * isPartialOverrideBlockGuard({ block, hostCount: 1, distinctPropertyCount: 2 });
 * // Returns true for `{ a?: Host['a']; b?: Host['b'] }`, false once any member is required
 * // or once the block carries a member that is not indexed off that host
 */
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isPartialOverrideBlockGuard = ({
  block,
  hostCount,
  distinctPropertyCount,
}: {
  block?: Tsestree;
  hostCount?: number;
  distinctPropertyCount?: number;
}): boolean => {
  if (!block || hostCount !== 1 || distinctPropertyCount === undefined) {
    return false;
  }

  // A TSTypeLiteral carries its members on `members`; a TSInterfaceBody carries them on `body`.
  const blockBody = Array.isArray(block.body) ? block.body : undefined;
  const members = block.members ?? blockBody;
  if (members === undefined) {
    return false;
  }

  // Every member must be an OPTIONAL property signature. One required member means the block is
  // describing something the caller must supply in full, which is a parameter list rather than an
  // override bag.
  const allOptional = members.every(
    (member) =>
      member.type === tsestreeNodeTypeStatics.nodeTypes.TSPropertySignature &&
      member.optional === true,
  );

  // And the host must account for ALL of them. A block mixing `Host['a']` with an unrelated field
  // is not a partial of Host, however optional both happen to be.
  return allOptional && members.length === distinctPropertyCount;
};
