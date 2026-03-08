/**
 * PURPOSE: Starts the design sandbox for a quest by posting to the design start endpoint
 *
 * USAGE:
 * const result = await designStartBroker({questId});
 * // Returns {port} indicating the Vite dev server port
 */

import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const designStartBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ port: Quest['designPort'] }> => {
  const url = webConfigStatics.api.routes.designStart.replace(':questId', questId);

  return fetchPostAdapter<{ port: Quest['designPort'] }>({ url, body: {} });
};
