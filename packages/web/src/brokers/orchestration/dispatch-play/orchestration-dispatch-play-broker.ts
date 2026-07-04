/**
 * PURPOSE: Requests the Node dispatcher to start playing via POST /api/orchestration/dispatch/play.
 * Surfaces the 409 denial body ({allowed: false, reason, state}) to callers instead of throwing,
 * so the UI can show the human-readable reason when a /dumpster-launch loop owns the queue.
 *
 * USAGE:
 * const result = await orchestrationDispatchPlayBroker();
 * // Returns DispatchPlayResponse { allowed, reason?, state }
 */
import { fetchPostWithStatusAdapter } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter';
import { dispatchPlayResponseContract } from '../../../contracts/dispatch-play-response/dispatch-play-response-contract';
import type { DispatchPlayResponse } from '../../../contracts/dispatch-play-response/dispatch-play-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPlayBroker = async ({
  force,
}: {
  force?: boolean;
} = {}): Promise<DispatchPlayResponse> => {
  const result = await fetchPostWithStatusAdapter({
    url: webConfigStatics.api.routes.orchestrationDispatchPlay,
    body: force === undefined ? {} : { force },
  });

  return dispatchPlayResponseContract.parse(result.body);
};
