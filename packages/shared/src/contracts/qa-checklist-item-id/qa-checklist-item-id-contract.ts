/**
 * PURPOSE: Defines the branded, DERIVED identifier for one QA checklist unit —
 * `<flowId>:<kind>:<localId>`, where localId is the node id (terminal), edge id (branch),
 * observable id (observable), or family name (off-map)
 *
 * USAGE:
 * qaChecklistItemIdContract.parse('view-persisted-comments:observable:check-badge-count-text');
 * // Returns: QaChecklistItemId branded string
 *
 * This id is COMPUTED from the flow graph, never minted or authored — re-enumerating an unchanged
 * flow reproduces byte-identical ids. That is what lets a later session resume against the ledger a
 * prior session wrote instead of re-deriving its whole pass, and it is why nothing here is a UUID.
 * All three segments are the same kebab-case shape every flow/node/edge/observable id already uses.
 */

import { z } from 'zod';

const KEBAB_SEGMENT = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';

export const qaChecklistItemIdContract = z
  .string()
  .min(1)
  .regex(new RegExp(`^${KEBAB_SEGMENT}:${KEBAB_SEGMENT}:${KEBAB_SEGMENT}$`, 'u'))
  .brand<'QaChecklistItemId'>();

export type QaChecklistItemId = z.infer<typeof qaChecklistItemIdContract>;
