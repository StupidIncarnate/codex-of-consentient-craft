/**
 * PURPOSE: Defines the structure of an active agent being orchestrated
 *
 * USAGE:
 * const agent: ActiveAgent = { slotIndex, workItemId, sessionId, followupDepth, promise };
 * // Tracks an agent running in an orchestration slot
 */

import { z } from '#gateway/npm/zod';

import { sessionIdContract } from '@dungeonmaster/shared/contracts';

import type { AgentSpawnStreamingResult } from '../agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { followupDepthContract } from '../followup-depth/followup-depth-contract';
import { slotIndexContract } from '@dungeonmaster/shared/contracts';
import { workItemIdContract } from '../work-item-id/work-item-id-contract';

// `promise` is a live Promise instance, not data: zod v4's object JIT compiler cannot validate a
// `z.promise()` field under sync `.parse()` (it crashes — `$ZodPromise._zod.parse` always returns a
// real Promise, and the compiled sync branch reads `.issues` off it as if it were a parse-result
// object) and `.parseAsync()` would await-and-revalidate the resolved value, which is not what this
// field means. `.loose()` carries it through unvalidated; the TypeScript intersection below restores
// the field for callers.
export const activeAgentContract = z
  .object({
    slotIndex: slotIndexContract,
    workItemId: workItemIdContract,
    sessionId: sessionIdContract.nullable(),
    // `followupDepthContract.parse(0)` re-derives the branded default value — a bare `0` fails the
    // same `.default()`-after-`.brand()` check `crashRetries` avoids by ordering, but this field's
    // own contract is already branded upstream (`followup-depth-contract.ts`), so re-parsing the
    // literal here is the fix rather than reordering a contract this file does not own.
    followupDepth: followupDepthContract.default(followupDepthContract.parse(0)),
    // `.default()` before `.brand()` — zod v4 checks a `.default()` literal against the schema's
    // own output type, and a bare number can never satisfy a branded type.
    crashRetries: z.number().int().nonnegative().default(0).brand<'CrashRetries'>(),
  })
  .loose();

export type ActiveAgent = z.infer<typeof activeAgentContract> & {
  promise: Promise<AgentSpawnStreamingResult>;
};
