/**
 * PURPOSE: Fetches the declared orchestrationMode (claude | node) from the API. The web reads this to
 * decide whether the create-quest surface is web-driven (node) or terminal-driven via /dumpster-create
 * (claude), and whether to honor the ?chat=hidden URL param.
 *
 * USAGE:
 * const mode = await orchestrationModeGetBroker();
 * // Returns OrchestrationMode ('claude' | 'node')
 */
import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { orchestrationModeGetResultContract } from '../../../contracts/orchestration-mode-get-result/orchestration-mode-get-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationModeGetBroker = async (): Promise<OrchestrationMode> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.orchestrationMode,
  });

  return orchestrationModeGetResultContract.parse(response).mode;
};
