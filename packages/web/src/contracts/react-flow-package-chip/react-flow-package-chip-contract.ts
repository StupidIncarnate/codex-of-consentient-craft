/**
 * PURPOSE: One package tag as the canvas needs it — the name the reviewer reads crossed with the
 * kind that decides its colour. Reach for this over a bare `packageNameContract` anywhere a card
 * PAINTS a tag, because the diagram may never colour off the name: a repo can hold several UI
 * packages and the same spec runs in repos whose package names this app has never seen. `packageType`
 * is resolvable only against the quest's own `packagesAffected`, which is why it is carried here
 * rather than looked up at paint time.
 *
 * USAGE:
 * reactFlowPackageChipContract.parse({ name: 'storefront-ui', packageType: 'frontend-react' });
 * // Returns: ReactFlowPackageChip
 */

import { z } from 'zod';

import { packageNameContract, packageTypeContract } from '@dungeonmaster/shared/contracts';

export const reactFlowPackageChipContract = z.object({
  name: packageNameContract,
  // Absent when the name the node tags has no matching entry in the quest's packagesAffected. That
  // is the coverage rule's own failure case, so the card paints it as unresolved rather than
  // guessing a kind — a wrong colour would report a defect as a legitimate boundary.
  packageType: packageTypeContract.optional(),
});

export type ReactFlowPackageChip = z.infer<typeof reactFlowPackageChipContract>;
