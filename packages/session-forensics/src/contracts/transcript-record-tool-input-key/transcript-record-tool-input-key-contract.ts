/**
 * PURPOSE: Validates a key of a tool_use content block's `input` record
 *
 * USAGE:
 * transcriptRecordToolInputKeyContract.parse('file_path');
 * // Returns the branded TranscriptRecordToolInputKey
 */
import { z } from 'zod';

export const transcriptRecordToolInputKeyContract = z
  .string()
  .brand<'TranscriptRecordToolInputKey'>();

export type TranscriptRecordToolInputKey = z.infer<typeof transcriptRecordToolInputKeyContract>;
