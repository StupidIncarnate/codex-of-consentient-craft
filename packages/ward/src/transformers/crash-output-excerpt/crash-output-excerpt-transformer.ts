/**
 * PURPOSE: Picks the part of a crashed check's output that names the failure. A jest run whose
 * `--json` report never arrived still printed its own human-readable report, but after whatever
 * the tests wrote to stdout — an install log, a CLI's echo — so the head of the output names
 * nothing. When a `●` failure header is present this returns the message under the first one;
 * otherwise the output unchanged. Reach for this over firstMeaningfulLineTransformer, which reads
 * ONE parsed failure message rather than a whole unparsed tool output.
 *
 * USAGE:
 * crashOutputExcerptTransformer({ output: '[OK] installed\nFAIL a.test.ts\n  ● A › b\n\n    thrown: "Exceeded timeout"' });
 * // Returns 'thrown: "Exceeded timeout"' as SummaryLine
 */

import type { SummaryLine } from '../../contracts/summary-line/summary-line-contract';
import { summaryLineContract } from '../../contracts/summary-line/summary-line-contract';

const JEST_FAILURE_HEADER = /^\s*● /u;

export const crashOutputExcerptTransformer = ({ output }: { output: string }): SummaryLine => {
  const lines = output.split('\n');
  const headerIndex = lines.findIndex((line) => JEST_FAILURE_HEADER.test(line));

  if (headerIndex < 0) {
    return summaryLineContract.parse(output);
  }

  const body = lines.slice(headerIndex + 1);
  const messageStart = body.findIndex((line) => line.trim().length > 0);

  if (messageStart < 0) {
    return summaryLineContract.parse(String(lines[headerIndex]).trim());
  }

  return summaryLineContract.parse(
    body
      .slice(messageStart)
      .map((line) => line.trim())
      .join('\n'),
  );
};
