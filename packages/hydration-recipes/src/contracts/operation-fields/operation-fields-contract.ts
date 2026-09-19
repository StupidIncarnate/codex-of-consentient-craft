/**
 * PURPOSE: What a caller may supply to add or set one row on a quest's operations ledger — the
 * whole ledger-item shape minus the server-minted `id`, plus the two foreign keys the record
 * itself does not carry. Reach for this over its sibling, `operationItemContract`, on a route's
 * INPUT side: an operation links to both its quest and that quest's guild, so `questId` and
 * `guildId` exist here only so the operation ingredient's `links` has somewhere to write them.
 * `operationItemContract` itself stays the operation ingredient's `record` — what a route hands
 * back once the row exists.
 *
 * USAGE:
 * operationFieldsContract.parse({
 *   text: 'Seeded operation 1',
 *   role: 'codeweaver',
 *   status: 'pending',
 *   questId: 'add-auth',
 *   guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns OperationFields
 */
import type { z } from 'zod';

import {
  guildIdContract,
  operationItemContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

export const operationFieldsContract = operationItemContract
  .omit({ id: true })
  .extend({ questId: questIdContract, guildId: guildIdContract });

export type OperationFields = z.infer<typeof operationFieldsContract>;
