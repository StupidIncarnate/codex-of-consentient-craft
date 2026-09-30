/**
 * PURPOSE: Extracts a session summary from a parsed JSONL object if it has type=summary and a summary field
 *
 * USAGE:
 * extractLineSummaryTransformer({ parsed: JSON.parse('{"type":"summary","summary":"Built login page"}') });
 * // Returns SessionSummary 'Built login page' or undefined if not a summary record
 */

import { summaryStreamLineContract } from '@dungeonmaster/shared/contracts';

export const extractLineSummaryTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): string | undefined => {
  const parsedLine = summaryStreamLineContract.safeParse(parsed);
  if (!parsedLine.success) {
    return undefined;
  }
  return parsedLine.data.summary;
};
