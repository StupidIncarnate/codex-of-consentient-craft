/**
 * PURPOSE: Starts quest execution by POSTing to the quest start API endpoint. Every rejection this
 * endpoint issues is a 400 whose body names the actual cause — a quest that is no longer startable,
 * a branch/worktree name already taken by an interrupted or overlapping Start, an unreadable
 * quest.json, a missing base branch. Those four are indistinguishable to a reader from a generic
 * "failed with status 400", and the only surface that ever carried the difference was the browser
 * console, so this broker throws the server's own text (falling back to the status line only when
 * there is no body to read).
 *
 * USAGE:
 * const { processId } = await questStartBroker({ questId });
 * // Returns { processId } on success; throws the server's exact rejection text otherwise
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostWithStatusAdapter } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter';
import { questStartResponseContract } from '../../../contracts/quest-start-response/quest-start-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questStartBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ processId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questStart.replace(':questId', questId);

  // `body: undefined` on purpose — Begin Quest sends no request body, the questId travels in the
  // URL only, and JSON.stringify(undefined) is undefined so fetch sends nothing.
  const result = await fetchPostWithStatusAdapter({ url, body: undefined });
  const parsed = questStartResponseContract.safeParse(result.body);

  if (result.ok) {
    if (parsed.success && parsed.data.processId !== undefined) {
      return { processId: processIdContract.parse(parsed.data.processId) };
    }
    // A 200 carrying no usable processId is a broken server contract, not a success.
    throw new Error(`POST ${url} returned 200 with no processId`);
  }

  if (parsed.success && parsed.data.error !== undefined) {
    throw new Error(parsed.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
