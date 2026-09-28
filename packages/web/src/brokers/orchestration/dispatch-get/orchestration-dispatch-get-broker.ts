/**
 * PURPOSE: Fetches the current Node dispatcher play/pause state from the API
 *
 * USAGE:
 * const state = await orchestrationDispatchGetBroker();
 * // Returns DispatchState { mode: 'node-playing' | 'paused', updatedAt }
 */
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { orchestrationDispatchResultContract } from '../../../contracts/orchestration-dispatch-result/orchestration-dispatch-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchGetBroker = async (): Promise<DispatchState> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.orchestrationDispatch,
  });

  return orchestrationDispatchResultContract.parse(response).state;
};
