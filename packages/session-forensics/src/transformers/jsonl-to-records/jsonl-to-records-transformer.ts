/**
 * PURPOSE: Splits raw JSONL transcript text into transcript records for forensic digests. A line that
 * fails JSON.parse or `transcriptRecordContract` validation is dropped rather than thrown on, and that
 * is deliberate, not a swallowed error: a transcript still being appended to when it is read routinely
 * ends in a half-written final line, and a forensic read of a finished session must never crash on it.
 *
 * USAGE:
 * jsonlToRecordsTransformer({ contents: ContentTextStub({ value: '{"type":"assistant"}\n{"type":"us' }) });
 * // Returns one TranscriptRecord for the first line; the truncated second line is dropped
 */

import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import {
  transcriptRecordContract,
  type TranscriptRecord,
} from '../../contracts/transcript-record/transcript-record-contract';

export const jsonlToRecordsTransformer = ({
  contents,
}: {
  contents: ContentText;
}): readonly TranscriptRecord[] =>
  contents.split('\n').flatMap((line): TranscriptRecord[] => {
    if (line.trim() === '') {
      return [];
    }

    const parsed = safeJsonParseTransformer({ value: line });
    if (!parsed.ok) {
      return [];
    }

    const result = transcriptRecordContract.safeParse(parsed.value);
    if (!result.success) {
      return [];
    }

    return [result.data];
  });
