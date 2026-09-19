/**
 * PURPOSE: Reads a whole seeded transcript file back into typed lines — the other half of
 * "every recipe carries a colocated test that runs it and asserts its `produces:` claim"
 * (siegelense-recipes.md line 548). Reach for this over splitting and `JSON.parse`ing in a test:
 * a cast would let what the assertion READS drift from what the recipe WROTE, and this recipe's
 * whole claim is about which line sits in which file.
 *
 * A trailing newline is normal (every writer here ends the file with one) and produces no empty
 * line.
 *
 * USAGE:
 * transcriptLinesReadTransformer({ contents: '{"uuid":"a"}\n{"uuid":"b"}\n' });
 * // Returns the two parsed TranscriptLines
 */

import type { FileContents } from '@dungeonmaster/shared/contracts';

import { transcriptLineContract } from '../../contracts/transcript-line/transcript-line-contract';
import type { TranscriptLine } from '../../contracts/transcript-line/transcript-line-contract';

export const transcriptLinesReadTransformer = ({
  contents,
}: {
  contents: FileContents;
}): readonly TranscriptLine[] =>
  contents
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => transcriptLineContract.parse(JSON.parse(line)));
