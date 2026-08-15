/**
 * PURPOSE: Names every `new`/`modified` contract — and every one of its properties — whose `source`
 * path sits under none of the packages the quest declared. The derived codeweaver ledger reads
 * those paths to mint each package's FOUNDATION item — the flow-less scope holding its contracts —
 * so a source resolving nowhere is work that silently reaches no operation item at all.
 *
 * A PROPERTY carries the same risk as the contract, because a property may declare its own
 * `source`: that is how one contract delivers into several packages, and it is the only carrier a
 * deliverable has when no observable mentions it. An unroutable property path therefore mints no
 * foundation item either, and is refused by property name so the author knows which line to fix.
 *
 * This is the contract-side twin of `questNodePackageCoverageViolationsTransformer`, and the two
 * exist for the same reason at two different gates: a node tag routes the units a flow cell owns,
 * and a contract source routes the units no flow node can carry. `shared` on the quest that
 * motivated this had ZERO tagged nodes and NINE contracts, so without this check its entire scope —
 * the status enum, the transitions table, the role roster — would derive to no item.
 *
 * Scoped to `new` and `modified` deliberately. An `existing` contract is reference material the
 * spec points at rather than work the quest performs, so it may legitimately live in a package the
 * quest never declared, and refusing it would force a spurious `packagesAffected` entry for a
 * package nobody is going to touch.
 *
 * USAGE:
 * questContractSourceCoverageViolationsTransformer({contracts: quest.contracts, packagesAffected: quest.packagesAffected});
 * // Returns ErrorMessage[] — one sentence per offending contract, each carrying its own remediation.
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { questContractSourceOwnerTransformer } from '../quest-contract-source-owner/quest-contract-source-owner-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questContractSourceCoverageViolationsTransformer = ({
  contracts,
  packagesAffected,
}: {
  contracts: Quest['contracts'];
  packagesAffected: Quest['packagesAffected'];
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const contract of contracts) {
    if (contract.status === 'existing') {
      continue;
    }

    // The SAME resolution the derived ledger mints foundation items through. Sharing it is what
    // makes this gate meaningful: a contract this refuses is exactly a contract the generator
    // would have dropped, and a divergence between the two would refuse work that does route, or
    // pass work that does not.
    if (questContractSourceOwnerTransformer({ contract, packagesAffected }) === undefined) {
      offenders.push(
        errorMessageContract.parse(
          `Contract '${String(contract.name)}' declares source '${String(contract.source)}', which sits under no package in quest.packagesAffected. The implementation ledger mints each package's foundation item from these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.`,
        ),
      );
    }

    // Only a property that DECLARES its own path is checked — one that omits it lives in the
    // contract's file, so reporting it would name the same bad path twice.
    for (const property of contract.properties) {
      if (
        property.source !== undefined &&
        questContractSourceOwnerTransformer({ contract, property, packagesAffected }) === undefined
      ) {
        offenders.push(
          errorMessageContract.parse(
            `Contract '${String(contract.name)}' property '${String(property.name)}' declares source '${String(property.source)}', which sits under no package in quest.packagesAffected. A property carrying its own source is how one contract delivers into several packages, so a property resolving nowhere reaches no session at all. Point it at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or drop the property source so it falls back to the contract's.`,
          ),
        );
      }
    }
  }

  return offenders;
};
