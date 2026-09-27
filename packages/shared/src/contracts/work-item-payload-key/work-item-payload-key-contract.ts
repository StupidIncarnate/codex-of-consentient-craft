/**
 * PURPOSE: A key into a work item's free-form `payload` record. The per-family shapes that record
 * carries live on the plan-file contract, not here, so this brands only the KEY — never an enum of
 * known keys — and a caller re-parses a literal (e.g. `'instance'`) through this contract to index
 * the branded `Record` `workItemContract`'s `payload` field returns.
 *
 * USAGE:
 * workItemPayloadKeyContract.parse('instance');
 * // Returns a branded WorkItemPayloadKey
 */

import { z } from 'zod';

export const workItemPayloadKeyContract = z.string().brand<'WorkItemPayloadKey'>();

export type WorkItemPayloadKey = z.infer<typeof workItemPayloadKeyContract>;
