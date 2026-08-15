/**
 * PURPOSE: Resolves the package ONE piece of a quest contract lands in — the contract itself, or a
 * single property of it. Reach for this over calling `packageForPathTransformer` on
 * `contract.source` directly: that answers for the contract's own file only, and it is the answer
 * the save-time gate, the derived ledger's foundation items and the codeweaver scope block must all
 * give identically or a contract one of them refuses is one another silently drops.
 *
 * A contract's `source` is one-to-one, but a contract is one-to-many. Measured on a real quest, a
 * `StatusKeyedStaticsFanout` was anchored in one package while two of its four properties named
 * files in another — and since no observable anywhere mentioned those two maps, the contract was
 * their only carrier. Resolving the whole contract by its own path sent them to a session whose
 * item did not declare their package, so nobody built them.
 *
 * A property with no `source` of its own lives in the contract's file and resolves with it, which
 * is why the fallback lives here rather than at each call site. Pass a TOP-LEVEL property only: a
 * nested one describes a field INSIDE its parent and therefore lives in the parent's file.
 *
 * USAGE:
 * questContractSourceOwnerTransformer({ contract, property, packagesAffected });
 * // Returns the PackageName that piece lands in, or undefined when its path sits under no
 * // declared package location
 */

import type {
  PackageName,
  QuestContractEntry,
  QuestContractProperty,
  QuestPackageEntry,
} from '@dungeonmaster/shared/contracts';
import { packageForPathTransformer } from '@dungeonmaster/shared/transformers';

export const questContractSourceOwnerTransformer = ({
  contract,
  property,
  packagesAffected,
}: {
  contract: QuestContractEntry;
  property?: QuestContractProperty;
  packagesAffected: readonly QuestPackageEntry[];
}): PackageName | undefined =>
  packageForPathTransformer({
    path: String(property?.source ?? contract.source),
    packagesAffected,
  });
