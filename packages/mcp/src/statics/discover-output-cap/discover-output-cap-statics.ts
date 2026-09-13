/**
 * PURPOSE: The ceilings discover's tree output obeys once a grep has produced hits. Reach for
 * these over the `discoverHintStatics` beside them: those shape the message shown when a search
 * finds NOTHING, these bound what is printed when it finds too much.
 *
 * `maxRunLines` has to stay BELOW `maxFileLines` or it is dead code — the per-file cap would
 * always bite first and no single run would ever reach its own limit.
 *
 * USAGE:
 * import { discoverOutputCapStatics } from '../../statics/discover-output-cap/discover-output-cap-statics';
 * discoverOutputCapStatics.grepOutput.maxRunLines;
 */
export const discoverOutputCapStatics = {
  grepOutput: {
    /** Lines kept from one unbroken run of consecutive hit/context lines. */
    maxRunLines: 20,
    /** Hit/context lines kept for one file, counted across all of its runs. */
    maxFileLines: 40,
    /** Byte budget for hit lines. Once spent, a file keeps its label and its match count only. */
    lineBudgetChars: 8000,
  },
} as const;
