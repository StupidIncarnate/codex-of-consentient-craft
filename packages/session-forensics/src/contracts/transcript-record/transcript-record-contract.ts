/**
 * PURPOSE: One parsed line of a Claude Code session JSONL transcript. The file is another program's
 * external output, so only the fields the forensics digest reads are declared; every other field a
 * real transcript carries is dropped by the schema rather than preserved, which is what stops a Claude
 * CLI format change from silently widening what this port depends on.
 *
 * USAGE:
 * transcriptRecordContract.parse({
 *   type: 'assistant',
 *   message: { model: 'claude-opus-5', content: [{ type: 'text', text: 'hi' }] },
 * });
 * // Returns the branded TranscriptRecord; every field but `type` is optional
 */
import { z } from 'zod';

import { agentIdContract } from '@dungeonmaster/shared/contracts';
import { transcriptRecordContentBlockContract } from '../transcript-record-content-block/transcript-record-content-block-contract';

const transcriptRecordMessageContract = z.object({
  model: z.string().brand<'TranscriptRecordModel'>().optional(),
  content: z
    .union([
      z.string().brand<'TranscriptRecordBareContent'>(),
      z.array(transcriptRecordContentBlockContract),
    ])
    .optional(),
  usage: z.record(z.unknown()).optional(),
});

export const transcriptRecordContract = z
  .object({
    type: z.enum([
      'assistant',
      'user',
      'attachment',
      'queue-operation',
      'last-prompt',
      'atis-latch',
    ]),
    timestamp: z.string().datetime().brand<'TranscriptRecordTimestamp'>().optional(),
    isSidechain: z.boolean().optional(),
    agentId: agentIdContract.optional(),
    promptSource: z.string().brand<'TranscriptRecordPromptSource'>().optional(),
    message: transcriptRecordMessageContract.optional(),
    toolUseResult: z.unknown().optional(),
  })
  .brand<'TranscriptRecord'>();

export type TranscriptRecord = z.infer<typeof transcriptRecordContract>;
