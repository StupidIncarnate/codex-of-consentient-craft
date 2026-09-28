/**
 * PURPOSE: Requests the Node dispatcher to start playing via POST /api/orchestration/dispatch/play
 *
 * USAGE:
 * const state = await orchestrationDispatchPlayBroker();
 * // Returns the updated DispatchState with mode 'node-playing'
 */
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPlayBroker = async (): Promise<DispatchState> => {
  const response = await fetchPostAdapter<{ state: unknown }>({
    url: webConfigStatics.api.routes.orchestrationDispatchPlay,
    body: {},
  });

  return dispatchStateContract.parse(response.state);
};
