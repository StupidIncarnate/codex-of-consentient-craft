/**
 * PURPOSE: The discriminator that says which operation items on the ledger belong to ONE family of
 * the quest-flow graph, and which seed in `questTypeRegistryStatics` mints them. Reach for this over
 * comparing `operation.role` to the family key: four of the six keys ARE role names and two are not,
 * so a direct comparison matches the COMMITTED ward gate as `wardFull` and completes a quest the
 * moment that gate goes green.
 *
 * USAGE:
 * familyLedgerKeyTransformer({ family: 'wardFull' });
 * // Returns { role: 'ward', wardMode: 'full' }
 */

import type { OperationItem } from '@dungeonmaster/shared/contracts';

export type FamilyLedgerKey = Pick<OperationItem, 'role' | 'wardMode'>;

// A TABLE rather than `role as FamilyKey`, because two rows are not a role name read back: `wardFull`
// shares its role with the committed ward gate and needs `wardMode` to tell them apart, and
// `warpgate` is appended at merge rather than routed to. The committed ward seed
// (`wardMode: 'committed'`) is named by NO row here, which is what keeps it mapped to no family at
// all — it is the `ward` STEP inside each code-changing family, not a family-level scope.
const LEDGER_KEY_BY_FAMILY = {
  riftcarver: { role: 'riftcarver' },
  codeweaver: { role: 'codeweaver' },
  flowrider: { role: 'flowrider' },
  siegemaster: { role: 'siegemaster' },
  wardFull: { role: 'ward', wardMode: 'full' },
  warpgate: { role: 'warpgate' },
} as const;

const KEY_LOOKUP = new Map(Object.entries(LEDGER_KEY_BY_FAMILY));

export const familyLedgerKeyTransformer = ({ family }: { family: string }): FamilyLedgerKey => {
  const key = KEY_LOOKUP.get(family);

  if (key === undefined) {
    throw new Error(
      `familyLedgerKeyTransformer: no ledger key for family '${family}' — the families are: ${Object.keys(LEDGER_KEY_BY_FAMILY).join(', ')}`,
    );
  }

  return key;
};
