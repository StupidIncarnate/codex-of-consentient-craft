/**
 * PURPOSE: Requests the Node dispatcher to start playing via POST /api/orchestration/dispatch/play
 *
 * USAGE:
 * const state = await orchestrationDispatchPlayBroker();
 * // Returns the updated DispatchState with mode 'node-playing'
 */
import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { orchestrationDispatchResultContract } from '../../../contracts/orchestration-dispatch-result/orchestration-dispatch-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPlayBroker = async (): Promise<DispatchState> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.orchestrationDispatchPlay,
    method: 'POST',
    body: {},
  });

  return orchestrationDispatchResultContract.parse(response).state;
};
