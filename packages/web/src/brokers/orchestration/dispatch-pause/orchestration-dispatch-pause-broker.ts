/**
 * PURPOSE: Pauses the Node dispatcher via POST /api/orchestration/dispatch/pause
 *
 * USAGE:
 * const state = await orchestrationDispatchPauseBroker();
 * // Returns the updated DispatchState with mode 'paused'
 */
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPauseBroker = async (): Promise<DispatchState> => {
  const response = await fetchPostAdapter<{ state: unknown }>({
    url: webConfigStatics.api.routes.orchestrationDispatchPause,
    body: {},
  });

  return dispatchStateContract.parse(response.state);
};
