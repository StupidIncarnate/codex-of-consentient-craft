/**
 * PURPOSE: Zod schema for a single Claude Code transcript JSONL line, exposing the `message.content[]` tool_use blocks the SubagentStop hook needs while tolerating every other line/content shape via passthrough
 *
 * USAGE:
 * const result = transcriptLineContract.safeParse(JSON.parse(line));
 * // On success: result.data.message.content is a string (user turns) or an array of content items (assistant turns)
 */
import { z } from 'zod';

const transcriptContentItemContract = z
  .object({
    type: z.string().brand<'TranscriptContentType'>(),
    name: z.string().min(1).brand<'TranscriptToolName'>().optional(),
    input: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const transcriptLineContract = z
  .object({
    message: z
      .object({
        content: z.union([
          z.string().brand<'TranscriptTextContent'>(),
          z.array(transcriptContentItemContract),
        ]),
      })
      .passthrough(),
  })
  .passthrough();

export type TranscriptLine = z.infer<typeof transcriptLineContract>;
export type TranscriptContentItem = z.infer<typeof transcriptContentItemContract>;
