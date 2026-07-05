/**
 * PURPOSE: Fetches the declared orchestrationMode (claude | node) from the API. The web reads this to
 * decide whether the create-quest surface is web-driven (node) or terminal-driven via /dumpster-create
 * (claude), and whether to honor the ?chat=hidden URL param.
 *
 * USAGE:
 * const mode = await orchestrationModeGetBroker();
 * // Returns OrchestrationMode ('claude' | 'node')
 */
import { orchestrationModeContract } from '@dungeonmaster/shared/contracts';
import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationModeGetBroker = async (): Promise<OrchestrationMode> => {
  const response = await fetchGetAdapter<{ mode: unknown }>({
    url: webConfigStatics.api.routes.orchestrationMode,
  });

  return orchestrationModeContract.parse(response.mode);
};
