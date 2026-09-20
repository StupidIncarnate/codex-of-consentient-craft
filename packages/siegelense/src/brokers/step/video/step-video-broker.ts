/**
 * PURPOSE: Drives the `video` step verb — invokes `session.videoAction({ action })`
 * on the browser session, then formats and returns the resulting ContentText reading.
 * Reach for this over inline session calls so video recording execution stays encapsulated
 * and governed by videoReadingRenderTransformer and videoStatics.
 *
 * USAGE:
 * await stepVideoBroker({ session, action: 'start' });
 * // Returns 'video recording started' as ContentText
 *
 * await stepVideoBroker({ session, action: 'stop' });
 * // Returns 'video recording stopped — saved to ...' as ContentText
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { VideoAction } from '../../../contracts/video-action/video-action-contract';
import { videoReadingRenderTransformer } from '../../../transformers/video-reading-render/video-reading-render-transformer';

export const stepVideoBroker = async ({
  session,
  action,
}: {
  session: BrowserSession;
  action: VideoAction;
}): Promise<ContentText> => {
  const result = await session.videoAction({ action });

  return videoReadingRenderTransformer({ result });
};
