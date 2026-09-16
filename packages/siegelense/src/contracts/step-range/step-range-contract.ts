/**
 * PURPOSE: The `'4-9'` form a `results` query's `where: { steps }` accepts to narrow rows to a
 * span of a run's step numbers — two nonnegative integers joined by
 * `resultsStatics.stepRange.separator`, never a parsed `{from, to}` pair, because this is the exact
 * string a caller types at a terminal and the exact string `resultWhereContract` stores. Reach for
 * this over two separate StepIndex fields whenever the value is THIS query-string span; expanding
 * it into the StepIndex values it names is `stepRangeExpandTransformer`'s job, not this contract's.
 *
 * USAGE:
 * stepRangeContract.parse('4-9');
 * // Returns: '4-9' as StepRange
 */

import { z } from 'zod';

export const stepRangeContract = z
  .string()
  .regex(/^\d+-\d+$/u)
  .brand<'StepRange'>();

export type StepRange = z.infer<typeof stepRangeContract>;
