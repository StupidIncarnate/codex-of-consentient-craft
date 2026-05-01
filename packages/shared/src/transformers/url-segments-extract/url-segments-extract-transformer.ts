/**
 * PURPOSE: Extracts non-param, non-api path segments from a URL pattern as keyword tokens.
 * Segments starting with `:` (path params) and the literal `api` are excluded.
 *
 * USAGE:
 * urlSegmentsExtractTransformer({
 *   urlPattern: contentTextContract.parse('/api/quests/:questId/start'),
 * });
 * // Returns ContentText[] ['quests', 'start']
 *
 * WHEN-TO-USE: http-backend headline renderer scoring responder import paths against URL segments
 * WHEN-NOT-TO-USE: When parameter segments are needed
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import { urlSegmentsExtractStatics } from '../../statics/url-segments-extract/url-segments-extract-statics';

export const urlSegmentsExtractTransformer = ({
  urlPattern,
}: {
  urlPattern: ContentText;
}): ContentText[] =>
  String(urlPattern)
    .split('/')
    .filter((seg) => {
      if (seg === '') return false;
      for (const skip of urlSegmentsExtractStatics.skipPrefixes) {
        if (seg.startsWith(skip)) return false;
      }
      return true;
    })
    .map((seg) => contentTextContract.parse(seg));
