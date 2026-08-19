/**
 * PURPOSE: Shared by the health badge and the `/health` detail page, so both surfaces parse the
 * server's snapshot through one contract rather than drifting into two shapes over time.
 *
 * USAGE:
 * const snapshot = await healthGetBroker();
 * // Returns HealthSnapshot. Rejects on a non-200, a network failure, or a 200 body that fails
 * // healthSnapshotContract parsing.
 */
import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';
import type { HealthSnapshot } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const healthGetBroker = async (): Promise<HealthSnapshot> => {
  const body = await fetchGetAdapter<unknown>({ url: webConfigStatics.api.routes.health });
  return healthSnapshotContract.parse(body);
};
