/**
 * PURPOSE: A sub-agent's own one-line task description — the short label Task's own `description`
 * argument carries. Reach for this over restating the brand inline: the subagent ingredient's
 * `defaults` needs the leaf contract directly (its own `fields` contract is upcast to
 * `z.ZodType<SubagentFields>` for `ingredient()`'s sake, so `.shape` is gone from it — see
 * `subagent-fields-contract.ts`'s own header).
 *
 * USAGE:
 * taskDescriptionContract.parse('Seeded task 1');
 * // Returns a branded TaskDescription
 */
import { z } from 'zod';

export const taskDescriptionContract = z.string().min(1).brand<'TaskDescription'>();

export type TaskDescription = z.infer<typeof taskDescriptionContract>;
