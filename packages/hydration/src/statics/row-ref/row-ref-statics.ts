/**
 * PURPOSE: The two literal tokens a row-ref's bracket is built from — the separator between a
 * row's `CallIndex` and its `RowIndex`, and the word a `filter`'s placeholder uses instead of
 * either. One source, read by `rowRefContract`'s own grammar, by `rowRefTransformer` and
 * `matchedRefTransformer` when they build a ref, and by their tests — so the separator or the
 * placeholder word never drifts between the grammar that VALIDATES a ref and the code that BUILDS
 * one. Neither token is a regex metacharacter, on purpose: the contract's pattern embeds them with
 * no escaping to get wrong.
 *
 * USAGE:
 * rowRefStatics.slot.separator;
 * // Returns ':'
 */
export const rowRefStatics = {
  slot: {
    separator: ':',
    matchWord: 'match',
  },
} as const;
