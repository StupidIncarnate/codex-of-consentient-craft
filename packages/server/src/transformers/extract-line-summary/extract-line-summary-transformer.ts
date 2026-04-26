/**
 * PURPOSE: Extracts a session summary from a parsed JSONL object if it has type=summary and a summary field
 *
 * USAGE:
 * extractLineSummaryTransformer({ parsed: JSON.parse('{"type":"summary","summary":"Built login page"}') });
 * // Returns SessionSummary 'Built login page' or undefined if not a summary record
 */

import { jsonlSessionLineContract } from '../../contracts/jsonl-session-line/jsonl-session-line-contract';
import {
  sessionSummaryContract,
  type SessionSummary,
} from '../../contracts/session-summary/session-summary-contract';

export const extractLineSummaryTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): SessionSummary | undefined => {
  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }
  const parsedLine = jsonlSessionLineContract.safeParse(parsed);
  if (!parsedLine.success) {
    return undefined;
  }
  const { type, summary } = parsedLine.data;
  if (type === 'summary' && summary !== undefined) {
    return sessionSummaryContract.parse(summary);
  }
  return undefined;
};
