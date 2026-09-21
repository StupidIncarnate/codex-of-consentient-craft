/**
 * PURPOSE: The discriminator that says which operation items on the ledger belong to ONE family of
 * the quest-flow graph. Reach for this over comparing `operation.role` to the family key: five of the
 * six keys ARE role names and `wardFull` is not, so a direct comparison finds no scope for the one
 * family that routes to `@complete`.
 *
 * USAGE:
 * familyLedgerKeyTransformer({ family: 'wardFull' });
 * // Returns { role: 'ward' }
 */

import type { OperationItem } from '@dungeonmaster/shared/contracts';

export type FamilyLedgerKey = Pick<OperationItem, 'role'>;

// A TABLE rather than `role as FamilyKey`, because `wardFull` is not a role name read back. It is
// the ONLY family whose role is `ward`, so the role alone identifies it — the committed ward is the
// `ward` STEP inside each code-changing family and holds no ledger scope of its own.
const LEDGER_KEY_BY_FAMILY = {
  riftcarver: { role: 'riftcarver' },
  codeweaver: { role: 'codeweaver' },
  flowrider: { role: 'flowrider' },
  siegemaster: { role: 'siegemaster' },
  wardFull: { role: 'ward' },
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
