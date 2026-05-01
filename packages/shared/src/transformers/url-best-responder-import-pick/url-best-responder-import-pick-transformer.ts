/**
 * PURPOSE: Picks the best-matching responder import path for a given URL pattern by scoring
 * each import against URL-derived keywords. Returns the highest-scoring import, or null if none.
 *
 * USAGE:
 * urlBestResponderImportPickTransformer({
 *   urlPattern: contentTextContract.parse('/api/quests/:questId/start'),
 *   responderImports: [
 *     contentTextContract.parse('../../responders/quest/start/quest-start-responder'),
 *     contentTextContract.parse('../../responders/quest/get/quest-get-responder'),
 *   ],
 * });
 * // Returns ContentText '../../responders/quest/start/quest-start-responder'
 *
 * WHEN-TO-USE: http-backend headline renderer selecting the responder for a route entry
 * when multiple responder imports appear in the flow file
 * WHEN-NOT-TO-USE: When a deterministic responder-per-route mapping is available
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { urlSegmentsExtractTransformer } from '../url-segments-extract/url-segments-extract-transformer';

export const urlBestResponderImportPickTransformer = ({
  urlPattern,
  responderImports,
}: {
  urlPattern: ContentText;
  responderImports: ContentText[];
}): ContentText | null => {
  if (responderImports.length === 0) {
    return null;
  }

  const keywords = urlSegmentsExtractTransformer({ urlPattern });

  let bestImport: ContentText | null = null;
  let bestScore = -1;

  for (const ip of responderImports) {
    const ipStr = String(ip);
    const score = keywords.filter((kw) => ipStr.includes(String(kw))).length;
    if (score > bestScore) {
      bestScore = score;
      bestImport = ip;
    }
  }

  return bestImport;
};
