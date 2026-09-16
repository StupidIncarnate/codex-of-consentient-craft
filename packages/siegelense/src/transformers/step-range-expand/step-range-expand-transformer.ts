/**
 * PURPOSE: Expands a `StepRange` query string (`'6-8'`) into the `StepIndex` values it names
 * (`[6, 7, 8]`), so a broker filtering rows by `where: { steps }` gets a set to test membership
 * against rather than reparsing the separator itself on every row. A reversed range (`'9-6'`)
 * expands to an EMPTY array rather than throwing — a caller's typo should answer "matched
 * nothing" the same way any other narrowing clause that matches nothing does, not crash the whole
 * query. Reach for this over parsing `stepRangeContract`'s separator inline anywhere a range needs
 * to become concrete step numbers.
 *
 * USAGE:
 * stepRangeExpandTransformer({ range: '6-8' });
 * // Returns [6, 7, 8] as readonly StepIndex[]
 */

import { stepIndexContract } from '../../contracts/step-index/step-index-contract';
import type { StepIndex } from '../../contracts/step-index/step-index-contract';
import type { StepRange } from '../../contracts/step-range/step-range-contract';
import { resultsStatics } from '../../statics/results/results-statics';

export const stepRangeExpandTransformer = ({
  range,
}: {
  range: StepRange;
}): readonly StepIndex[] => {
  const [startText, endText] = range.split(resultsStatics.stepRange.separator);
  const start = Number(startText);
  const end = Number(endText);
  const count = Math.max(end - start + 1, 0);

  return Array.from({ length: count }, (_unused, offset) =>
    stepIndexContract.parse(start + offset),
  );
};
