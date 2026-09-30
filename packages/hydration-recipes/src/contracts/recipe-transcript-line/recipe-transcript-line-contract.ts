/**
 * PURPOSE: One line of a seeded Claude session transcript, as much of it as anything READING a
 * recipe's output has to address — the `uuid` and `timestamp` that decide replay order, the
 * `toolUseResult.agentId` that pairs a sub-agent's file back to the Task that launched it, and the
 * content items a chain's body is made of. Reach for this over `JSON.parse` plus a cast: a recipe
 * test that asserts its own output has to READ that output, and a cast would let the read drift
 * from what was written without anything failing.
 *
 * Deliberately `.loose()` and mostly optional: this is a READ shape for the fields a
 * recipe's claim is made of, never a second declaration of the whole Claude CLI line format. The
 * stream-line contracts in `@dungeonmaster/shared/contracts` own that, and a stricter copy here
 * would be exactly the drift `fidelity: direct` exists to warn about.
 *
 * USAGE:
 * recipeTranscriptLineContract.parse(JSON.parse(rawLine));
 * // Returns the fields a recipe's own assertions address
 */

import { z } from '#gateway/npm/zod';
import { agentContract, toolUseContract } from '@dungeonmaster/shared/contracts';

const CONTENT_ITEM = z
  .object({
    type: z.string().min(1).brand<'CONTENTITEMType'>(),
    text: z.string().brand<'CONTENTITEMText'>().optional(),
    id: z.string().min(1).brand<'CONTENTITEMId'>().optional(),
    tool_use_id: toolUseContract.shape.id.optional(),
  })
  .brand<'CONTENTITEM'>()
  .loose();

export const recipeTranscriptLineContract = z
  .object({
    uuid: z.string().min(1).brand<'RecipeTranscriptLineUuid'>(),
    timestamp: z.string().min(1).brand<'RecipeTranscriptLineTimestamp'>(),
    message: z
      .object({
        content: z.union([
          z.string().brand<'RecipeTranscriptLineMessageContent'>(),
          z.array(CONTENT_ITEM),
        ]),
      })
      .brand<'RecipeTranscriptLineMessage'>()
      .loose(),
    toolUseResult: z
      .object({ agentId: agentContract.shape.id })
      .brand<'RecipeTranscriptLineToolUseResult'>()
      .loose()
      .optional(),
  })
  .loose()
  .brand<'RecipeTranscriptLine'>();

export type RecipeTranscriptLine = z.infer<typeof recipeTranscriptLineContract>;
