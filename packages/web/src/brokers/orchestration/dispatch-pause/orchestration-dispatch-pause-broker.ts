/**
 * PURPOSE: Pauses the Node dispatcher via POST /api/orchestration/dispatch/pause
 *
 * USAGE:
 * const state = await orchestrationDispatchPauseBroker();
 * // Returns the updated DispatchState with mode 'paused'
 */
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { orchestrationDispatchResultContract } from '../../../contracts/orchestration-dispatch-result/orchestration-dispatch-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPauseBroker = async (): Promise<DispatchState> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.orchestrationDispatchPause,
    method: 'POST',
    body: {},
  });

  return orchestrationDispatchResultContract.parse(response).state;
};
