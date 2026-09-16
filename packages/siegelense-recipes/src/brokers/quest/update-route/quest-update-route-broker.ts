/**
 * PURPOSE: The quest ingredient's `update` route — narrows `fields` to what `questModifyBroker`
 * accepts, applies them, then reloads the quest through `questGetBroker` so the return value is a
 * real `Quest` the runner's `record` contract (`questContract`) can parse. `questModifyBroker`'s
 * own `ModifyQuestResult` carries no quest data at all (`{ success, error?, failedChecks? }`), and
 * several of the modifiable fields (`toolingRequirements`, `contracts`, `flows`, `planningNotes`, …)
 * are UPSERTED rather than overwritten — approximating the outcome by merging `fields` onto
 * `record` locally, the way `operationUpdateRouteBroker` does for a route that writes the whole
 * file itself, would silently diverge from what the broker actually persisted. Reloading is the
 * only honest source. Reach for `questModifyBroker` directly (not through `StartOrchestrator`): it
 * IS exported from `@dungeonmaster/orchestrator`'s `src/index.ts`, unlike
 * `questPersistBroker`/`guildAddBroker`.
 *
 * Both calls THROW on failure rather than handing back their own result envelope — the runner's
 * `opUpdateApplyLayerBroker` already wraps whatever this route throws through
 * `routeFailureTransformer` into a `HydrationRouteFailedError`, exactly as it does for every other
 * ingredient's `update` route, so this file adds no error-shaping logic of its own.
 *
 * USAGE:
 * await questUpdateRouteBroker({ target, record: quest, fields: { title: 'renamed' } });
 * // Returns the reloaded Quest record on success; throws naming the failure otherwise
 */
import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator';
import {
  getQuestInputContract,
  questContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { questFieldsToModifyInputTransformer } from '../../../transformers/quest-fields-to-modify-input/quest-fields-to-modify-input-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questUpdateRouteBroker = async ({
  record,
  fields,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  fields: Record<string, unknown>;
}): Promise<Quest> => {
  const questId = questIdContract.parse(record.id);
  const input = questFieldsToModifyInputTransformer({ questId, fields });

  const modifyResult = await questModifyBroker({ input });
  if (!modifyResult.success) {
    throw new Error(`questUpdateRouteBroker: modify failed — ${String(modifyResult.error)}`);
  }

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success) {
    throw new Error(`questUpdateRouteBroker: reload failed — ${String(getResult.error)}`);
  }

  return questContract.parse(getResult.quest);
};
