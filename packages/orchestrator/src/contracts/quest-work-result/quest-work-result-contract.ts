/**
 * PURPOSE: What `QuestWorkResponder` hands back once ANY of `quest-work`'s six payloads has been
 * applied — the plan-bearing two (`plan`, `amendment`), sharing one shape since both write the same
 * kind of file, plus the four record-bearing kinds `questWorkRecordResultContract` already
 * discriminates. Reuses that contract's own branches (`.options`) rather than re-declaring their
 * four shapes a second time.
 *
 * USAGE:
 * questWorkResultContract.parse({ kind: 'plan', operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
 * // Returns: QuestWorkResult
 */

import { operationItemIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { questWorkRecordResultContract } from '../quest-work-record-result/quest-work-record-result-contract';

export const questWorkResultContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('plan'), operationItemId: operationItemIdContract }),
  z.object({ kind: z.literal('amendment'), operationItemId: operationItemIdContract }),
  ...questWorkRecordResultContract.options,
]);

export type QuestWorkResult = z.infer<typeof questWorkResultContract>;
