/**
 * PURPOSE: The set difference `compare` reports for one index field — every line in `linesB` that
 * `linesA` never produced, deduplicated and capped at `resultsStatics.limits.maxRows` (the same
 * ceiling `results` enforces on any one answer, siegelense-tooling.md §3.F: "the set difference:
 * lines present in run B and not in run A"). `compareReadBroker` calls this once per index field
 * (console, server, network) with each run's own extracted display lines, never raw JSONL — capping
 * and deduplication belong in one place rather than three call sites reimplementing both.
 *
 * USAGE:
 * newLinesLayerBroker({
 *   linesA: [ContentTextStub({ value: 'a' })],
 *   linesB: [ContentTextStub({ value: 'a' }), ContentTextStub({ value: 'b' })],
 * });
 * // Returns ['b'] — the one line unique to linesB
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { resultsStatics } from '../../../statics/results/results-statics';

export const newLinesLayerBroker = ({
  linesA,
  linesB,
}: {
  linesA: readonly ContentText[];
  linesB: readonly ContentText[];
}): readonly ContentText[] => {
  const setA = new Set(linesA);
  const uniqueNew = [...new Set(linesB)].filter((line) => !setA.has(line));

  return uniqueNew.slice(0, resultsStatics.limits.maxRows);
};
