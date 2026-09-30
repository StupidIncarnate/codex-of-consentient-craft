/**
 * PURPOSE: Drives the `video` step verb — invokes `session.videoAction({ action })`
 * on the browser session, then formats and returns the resulting ContentText reading.
 * Reach for this over inline session calls so video recording execution stays encapsulated
 * and governed by videoReadingRenderTransformer and videoStatics. A `stop` answer's path is
 * resolved through `locationsRepoLinkPathFindBroker` before rendering — `start`/`status`/`kill`
 * already resolve their own paths through that same alias before returning
 * (packages/siegelense/CLAUDE.md: "every path handed back is repo-local"); this verb's own
 * `session.videoAction` cannot do that resolution itself, since `adapters/` may not import the
 * `locations/` brokers that walk the repo root. A path that does not parse as absolute skips the
 * resolution and renders unchanged rather than throwing — `locationsRepoLinkPathFindBroker` assumes
 * an absolute `homePath`, and a driver-shaped placeholder is never worth failing the whole reading
 * over.
 *
 * USAGE:
 * await stepVideoBroker({ session, action: 'start' });
 * // Returns 'video recording started' as ContentText
 *
 * await stepVideoBroker({ session, action: 'stop' });
 * // Returns 'video recording stopped — saved to <repo-local path>' as ContentText
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { VideoAction } from '../../../contracts/video-action/video-action-contract';
import { videoResultContract } from '../../../contracts/video-result/video-result-contract';
import { videoReadingRenderTransformer } from '../../../transformers/video-reading-render/video-reading-render-transformer';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';

export const stepVideoBroker = async ({
  session,
  action,
}: {
  session: BrowserSession;
  action: VideoAction;
}): Promise<string> => {
  const result = await session.videoAction({ action });

  if (result.status !== 'stopped' || result.path === null) {
    return videoReadingRenderTransformer({ result });
  }

  const parsedPath = absoluteFilePathContract.safeParse(result.path);
  if (!parsedPath.success) {
    return videoReadingRenderTransformer({ result });
  }

  const { path: reportedPath } = await locationsRepoLinkPathFindBroker({
    homePath: parsedPath.data,
  });

  return videoReadingRenderTransformer({
    result: videoResultContract.parse({ status: result.status, path: reportedPath }),
  });
};
