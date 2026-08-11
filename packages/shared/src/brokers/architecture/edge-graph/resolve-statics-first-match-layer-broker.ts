/**
 * PURPOSE: Reach for this over calling staticsPathResolveTransformer directly when a repo may
 * carry more than one statics source for the same dotted reference — a project with several
 * http-backend or frontend packages each ships its own api-routes/web-config statics file, and
 * httpEdgesLayerBroker does not know in advance which one (if any) defines the requested path.
 *
 * USAGE:
 * const url = resolveStaticsFirstMatchLayerBroker({
 *   sources: [serverAStaticsSource, serverBStaticsSource],
 *   dotPath: contentTextContract.parse('apiRoutesStatics.quests.list'),
 * });
 * // Returns '/api/quests' from whichever source defines it first, or null if none do
 *
 * WHEN-TO-USE: Inside httpEdgesLayerBroker when resolving a statics reference against the set of
 * statics sources collected from every matching package
 */

import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { staticsPathResolveTransformer } from '../../../transformers/statics-path-resolve/statics-path-resolve-transformer';

export const resolveStaticsFirstMatchLayerBroker = ({
  sources,
  dotPath,
}: {
  sources: ContentText[];
  dotPath: ContentText;
}): ContentText | null => {
  for (const source of sources) {
    const resolved = staticsPathResolveTransformer({ source, dotPath });
    if (resolved !== null) {
      return resolved;
    }
  }
  return null;
};
