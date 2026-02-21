/**
 * PURPOSE: Extracts a session summary from a parsed JSONL object if it has type=summary and a summary field
 *
 * USAGE:
 * extractLineSummaryTransformer({ parsed: JSON.parse('{"type":"summary","summary":"Built login page"}') });
 * // Returns SessionSummary 'Built login page' or undefined if not a summary record
 */

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
  const lineType: unknown = Reflect.get(parsed, 'type');
  const lineSummary: unknown = Reflect.get(parsed, 'summary');
  if (lineType === 'summary' && typeof lineSummary === 'string') {
    return sessionSummaryContract.parse(lineSummary);
  }
  return undefined;
};
