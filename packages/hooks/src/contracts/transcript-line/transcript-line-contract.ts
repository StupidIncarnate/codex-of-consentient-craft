/**
 * PURPOSE: Zod schema for a single Claude Code transcript JSONL line, exposing the `message.content[]` tool_use blocks the SubagentStop hook needs while tolerating every other line/content shape via passthrough
 *
 * USAGE:
 * const result = transcriptLineContract.safeParse(JSON.parse(line));
 * // On success: result.data.message.content is a string (user turns) or an array of content items (assistant turns)
 */
import { z } from '#gateway/npm/zod';

const transcriptContentItemContract = z
  .object({
    type: z.string().brand<'TranscriptContentItemType'>(),
    name: z.string().min(1).brand<'TranscriptContentItemName'>().optional(),
    input: z.record(z.string(), z.json()).optional(),
  })
  .brand<'TranscriptContentItem'>()
  .loose();

export const transcriptLineContract = z
  .object({
    message: z
      .object({
        content: z.union([
          z.string().brand<'TranscriptLineMessageContent'>(),
          z.array(transcriptContentItemContract),
        ]),
      })
      .brand<'TranscriptLineMessage'>()
      .loose(),
  })
  .loose()
  .brand<'TranscriptLine'>();

export type TranscriptLine = z.infer<typeof transcriptLineContract>;
