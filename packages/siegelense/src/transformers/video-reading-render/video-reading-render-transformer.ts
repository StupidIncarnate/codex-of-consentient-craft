/**
 * PURPOSE: Formats a VideoResult into a single-line ContentText reading describing
 * video recording state — whether recording started or was stopped and where it was saved.
 * Reach for this over inline string interpolation so video reading presentation stays
 * governed by videoStatics across step brokers and result renderers.
 *
 * USAGE:
 * videoReadingRenderTransformer({ result: { status: 'started', path: null } });
 * // Returns 'video recording started' as ContentText
 *
 * videoReadingRenderTransformer({ result: { status: 'stopped', path: '/path/video.webm' } });
 * // Returns 'video recording stopped — saved to /path/video.webm' as ContentText
 */


import type { VideoResult } from '../../contracts/video-result/video-result-contract';
import { videoStatics } from '../../statics/video/video-statics';

export const videoReadingRenderTransformer = ({ result }: { result: VideoResult }): string => {
  if (result.status === 'started') {
    return videoStatics.readings.started;
  }

  const targetPath = result.path ?? 'evidence/video';
  return videoStatics.readings.stopped.replace('{path}', targetPath);
};
