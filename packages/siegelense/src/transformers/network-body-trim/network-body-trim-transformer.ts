/**
 * PURPOSE: Trims a network exchange's request/response body to
 * `resultsStatics.render.bodyTrimChars` for the `results --kind network` text view — long enough
 * that a real error body's shape still reads, short enough that a screenful of rows stays a
 * screenful. A body at or under the ceiling passes through unchanged, with no trailing ellipsis.
 *
 * USAGE:
 * networkBodyTrimTransformer({ body: ContentTextStub({ value: 'x'.repeat(300) }) });
 * // Returns the first 200 characters followed by an ellipsis, as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { resultsStatics } from '../../statics/results/results-statics';

export const networkBodyTrimTransformer = ({ body }: { body: ContentText }): ContentText =>
  contentTextContract.parse(
    body.length > resultsStatics.render.bodyTrimChars
      ? `${body.slice(0, resultsStatics.render.bodyTrimChars)}…`
      : body,
  );
