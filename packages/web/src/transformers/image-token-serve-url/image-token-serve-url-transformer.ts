/**
 * PURPOSE: Points every `![Pasted Image N](...)` token at the image-serve route, so text holding the
 * RAW filesystem path the server wrote can be rendered. Reach for this before showing
 * `quest.userRequest`, which is the one surface that stores those tokens unresolved — a chat entry
 * has already been through the orchestrator's `imagePathToUrlTransformer` by the time the browser
 * sees it, and running this over one again would find nothing left to do.
 *
 * The URL it builds is ROOT-RELATIVE, unlike the orchestrator's, which stamps a server base URL in.
 * The orchestrator is writing for a reader it cannot see; this runs IN the page, where the API and
 * the bundle share an origin — every other request this package makes is relative for the same
 * reason.
 *
 * A token already pointing at a URL is left exactly as it is, matched by the scheme or by the serve
 * route itself. Percent-encoding an encoded path a second time is what that guard prevents, and it
 * is what makes this safe to run over text of unknown provenance.
 *
 * USAGE:
 * imageTokenServeUrlTransformer({ content: 'See ![Pasted Image 1](/q/images/a.png)' });
 * // Returns branded ServedImageContent 'See ![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png)'
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { servedImageContentContract } from '../../contracts/served-image-content/served-image-content-contract';
import type { ServedImageContent } from '../../contracts/served-image-content/served-image-content-contract';

// A URI scheme opening the target — `http:`, `https:`, `data:`, `blob:`. Anchored, so a path that
// merely CONTAINS a colon is not mistaken for one.
const URI_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;

export const imageTokenServeUrlTransformer = ({
  content,
}: {
  content: string;
}): ServedImageContent =>
  servedImageContentContract.parse(
    content.replace(
      new RegExp(pastedImageStatics.imageTokenPattern, 'gu'),
      (match: string, ordinal: string, target: string) => {
        if (
          URI_SCHEME_PATTERN.test(target) ||
          target.startsWith(pastedImageStatics.serveRoutePath)
        ) {
          return match;
        }

        return `![Pasted Image ${ordinal}](${pastedImageStatics.serveRoutePath}?path=${encodeURIComponent(target)})`;
      },
    ),
  );
