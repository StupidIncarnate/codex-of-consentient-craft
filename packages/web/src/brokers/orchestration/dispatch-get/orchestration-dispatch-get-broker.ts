/**
 * PURPOSE: Fetches the current Node dispatcher play/pause state from the API
 *
 * USAGE:
 * const state = await orchestrationDispatchGetBroker();
 * // Returns DispatchState { mode: 'node-playing' | 'paused', mcpHeartbeatAt?, updatedAt }
 */
import { dispatchStateContract } from '@dungeonmaster/shared/contracts';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchGetBroker = async (): Promise<DispatchState> => {
  const response = await fetchGetAdapter<{ state: unknown }>({
    url: webConfigStatics.api.routes.orchestrationDispatch,
  });

  return dispatchStateContract.parse(response.state);
};
