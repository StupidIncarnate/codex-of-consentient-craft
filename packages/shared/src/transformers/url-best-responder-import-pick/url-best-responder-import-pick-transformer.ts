/**
 * PURPOSE: Picks the best-matching responder import path for a given URL pattern by scoring
 * each import against URL-derived keywords. Returns the highest-scoring import, or null if none.
 *
 * USAGE:
 * urlBestResponderImportPickTransformer({
 *   urlPattern: '/api/quests/:questId/start',
 *   responderImports: [
 *     '../../responders/quest/start/quest-start-responder',
 *     '../../responders/quest/get/quest-get-responder',
 *   ],
 * });
 * // Returns ContentText '../../responders/quest/start/quest-start-responder'
 *
 * WHEN-TO-USE: http-backend headline renderer selecting the responder for a route entry
 * when multiple responder imports appear in the flow file
 * WHEN-NOT-TO-USE: When a deterministic responder-per-route mapping is available
 */

import { urlSegmentsExtractTransformer } from '../url-segments-extract/url-segments-extract-transformer';

export const urlBestResponderImportPickTransformer = ({
  urlPattern,
  responderImports,
}: {
  urlPattern: string;
  responderImports: string[];
}): string | null => {
  if (responderImports.length === 0) {
    return null;
  }

  const keywords = urlSegmentsExtractTransformer({ urlPattern });

  let bestImport: string | null = null;
  let bestScore = -1;

  for (const ip of responderImports) {
    const ipStr = ip;
    const score = keywords.filter((kw) => ipStr.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestImport = ip;
    }
  }

  return bestImport;
};
