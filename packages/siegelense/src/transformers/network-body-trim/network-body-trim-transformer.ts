/**
 * PURPOSE: Collapses every whitespace run (newlines, tabs, repeated spaces) in a network
 * exchange's request/response body to a single space, so an HTML or pretty-printed body renders
 * as one line in the `results --kind network` text view, then trims the collapsed body to
 * `resultsStatics.render.bodyTrimChars` — long enough that a real error body's shape still reads,
 * short enough that a screenful of rows stays a screenful. Collapsing runs BEFORE trimming to
 * length keeps the trim budget spent on content, not on a run of newlines. A collapsed body at or
 * under the ceiling passes through unchanged, with no trailing ellipsis.
 *
 * USAGE:
 * networkBodyTrimTransformer({ body: ContentTextStub({ value: '<a>\n<b>' }) });
 * // Returns '<a> <b>' as ContentText
 */

import { resultsStatics } from '../../statics/results/results-statics';

export const networkBodyTrimTransformer = ({ body }: { body: string }): string => {
  const collapsed = body.replace(/\s+/gu, ' ');
  return collapsed.length > resultsStatics.render.bodyTrimChars
    ? `${collapsed.slice(0, resultsStatics.render.bodyTrimChars)}…`
    : collapsed;
};
