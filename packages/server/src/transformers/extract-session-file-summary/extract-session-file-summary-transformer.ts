/**
 * PURPOSE: Extracts a session summary from JSONL file contents by checking last line, first line, then slug fields
 *
 * USAGE:
 * extractSessionFileSummaryTransformer({ fileContent: fileContentsContract.parse('{"type":"summary","summary":"Built login"}') });
 * // Returns SessionSummary 'Built login' or undefined if no summary found
 */

import type { FileContents } from '../../contracts/file-contents/file-contents-contract';
import {
  sessionSummaryContract,
  type SessionSummary,
} from '../../contracts/session-summary/session-summary-contract';
import { extractFirstUserMessageTransformer } from '../extract-first-user-message/extract-first-user-message-transformer';
import { extractLineSummaryTransformer } from '../extract-line-summary/extract-line-summary-transformer';

const SLUG_SCAN_LIMIT = 5;

export const extractSessionFileSummaryTransformer = ({
  fileContent,
}: {
  fileContent: FileContents;
}): SessionSummary | undefined => {
  if (!fileContent) {
    return undefined;
  }

  const lines = fileContent.trimEnd().split('\n');

  // Check last line first (most common location for summary)
  const lastLine = lines[lines.length - 1];
  if (lastLine) {
    try {
      const lastParsed: unknown = JSON.parse(lastLine);
      const summaryFromLast = extractLineSummaryTransformer({ parsed: lastParsed });
      if (summaryFromLast) {
        return summaryFromLast;
      }
    } catch {
      // not valid JSON
    }
  }

  // Check first line
  const [firstLine] = lines;
  if (firstLine) {
    try {
      const firstParsed: unknown = JSON.parse(firstLine);
      const summaryFromFirst = extractLineSummaryTransformer({ parsed: firstParsed });
      if (summaryFromFirst) {
        return summaryFromFirst;
      }
    } catch {
      // not valid JSON
    }
  }

  // Look for slug field in first few lines
  const scanLimit = Math.min(lines.length, SLUG_SCAN_LIMIT);
  for (let i = 0; i < scanLimit; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(line);
      if (typeof parsed === 'object' && parsed !== null) {
        const slug: unknown = Reflect.get(parsed, 'slug');
        if (typeof slug === 'string' && slug.length > 0) {
          return sessionSummaryContract.parse(slug);
        }
      }
    } catch {
      // skip unparseable lines
    }
  }

  // Fallback: extract first user message as summary
  const userMessageSummary = extractFirstUserMessageTransformer({ fileContent });
  if (userMessageSummary) {
    return userMessageSummary;
  }

  return undefined;
};
