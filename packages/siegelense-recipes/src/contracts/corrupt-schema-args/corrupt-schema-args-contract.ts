/**
 * PURPOSE: The arguments a quest's `corruptToLegacySchema` extra takes — none. Reach for this over
 * inlining `z.object({})` at the extra's declaration: a bare literal there reads as a placeholder
 * nobody finished, where a named contract reads as "this verb genuinely takes nothing," and it is
 * the one file that grows a field if a future legacy shape ever needs one.
 *
 * USAGE:
 * corruptSchemaArgsContract.parse({});
 * // Returns CorruptSchemaArgs
 */
import { z } from 'zod';

export const corruptSchemaArgsContract = z.object({});

export type CorruptSchemaArgs = z.infer<typeof corruptSchemaArgsContract>;
