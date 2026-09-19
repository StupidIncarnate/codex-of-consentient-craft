/**
 * PURPOSE: One line of a seeded Claude session transcript, as much of it as anything READING a
 * recipe's output has to address — the `uuid` and `timestamp` that decide replay order, the
 * `toolUseResult.agentId` that pairs a sub-agent's file back to the Task that launched it, and the
 * content items a chain's body is made of. Reach for this over `JSON.parse` plus a cast: a recipe
 * test that asserts its own output has to READ that output, and a cast would let the read drift
 * from what was written without anything failing.
 *
 * Deliberately `.passthrough()` and mostly optional: this is a READ shape for the fields a
 * recipe's claim is made of, never a second declaration of the whole Claude CLI line format. The
 * stream-line contracts in `@dungeonmaster/shared/contracts` own that, and a stricter copy here
 * would be exactly the drift `fidelity: direct` exists to warn about.
 *
 * USAGE:
 * transcriptLineContract.parse(JSON.parse(rawLine));
 * // Returns the fields a recipe's own assertions address
 */

import { z } from 'zod';

const CONTENT_ITEM = z
  .object({
    type: z.string().min(1).brand<'TranscriptContentType'>(),
    text: z.string().brand<'TranscriptContentText'>().optional(),
    id: z.string().min(1).brand<'TranscriptToolUseId'>().optional(),
    tool_use_id: z.string().min(1).brand<'TranscriptToolUseId'>().optional(),
  })
  .passthrough();

export const transcriptLineContract = z
  .object({
    uuid: z.string().min(1).brand<'TranscriptLineUuid'>(),
    timestamp: z.string().min(1).brand<'TranscriptLineTimestamp'>(),
    message: z
      .object({
        content: z.union([z.string().brand<'TranscriptUserText'>(), z.array(CONTENT_ITEM)]),
      })
      .passthrough(),
    toolUseResult: z
      .object({ agentId: z.string().min(1).brand<'TranscriptAgentId'>() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type TranscriptLine = z.infer<typeof transcriptLineContract>;
