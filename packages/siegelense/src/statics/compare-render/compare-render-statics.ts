/**
 * PURPOSE: The caps and fixed lines `compareAnswerRenderTransformer` prints — how many of each run-B-only
 * console, server and network line the text view lists before pointing at `--json`, and the one
 * line standing in for element comparison, which `compare` does not do between two runs. Reach for
 * this over `resultsStatics` when the value shapes compare's TEXT view, not what a query returns.
 *
 * USAGE:
 * compareRenderStatics.newLines.cap;
 * // Returns 5
 */

export const compareRenderStatics = {
  newLines: {
    cap: 5,
    indent: '  ',
    moreTemplate: '  ... {count} more in --json',
  },
  elements: {
    notCompared:
      "ELEMENTS: not compared between the two runs (each run's own last element delta is in --json)",
  },
} as const;
