/**
 * PURPOSE: The quest ingredient's `transitions.reach` — walks a quest's status from `from` to `to`
 * hop by hop over the real edge list (`questStatusWalkPathTransformer`), through `questModifyBroker`
 * for every ordinary hop and through the real START route for the one hop that mints more than a
 * field: `in_progress` seeds the operations relay, and nothing does that but
 * `POST /api/quests/:questId/start` — `orchestration-start-responder`'s own logic is not exported
 * from `@dungeonmaster/orchestrator`'s barrel (confirmed by reading `src/index.ts`), so a write-only
 * target has no honest way to reach `in_progress` and this route says so rather than flipping the
 * field and leaving the ledger empty, which is exactly the silent drift
 * `packages/orchestrator/CLAUDE.md` warns `writeQuestFile` produces.
 *
 * `questModifyBroker` and `questGetBroker` are imported BY PATH from the orchestrator's
 * `/brokers` subpath rather than through the main `.` barrel — importing anything from `.`
 * evaluates `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a
 * stale-process watchdog at module scope, and this package is a short-lived hydration tool, not
 * the long-running server those exist for. Both brokers still resolve their quest file via the
 * GLOBAL `process.env.DUNGEONMASTER_HOME`, never via `target.home` — the same escape-the-target
 * trap `packages/hydration-recipes/CLAUDE.md` already documents for `guildWriteRouteBroker` and
 * `operationWriteRouteBroker`. This route inherits it rather than fixing it: `fileTargetHarness`
 * sets that env var for the duration of a test for exactly this reason.
 *
 * USAGE:
 * await questReachRouteBroker({ from: 'created', to: 'explore_flows', target, record: quest });
 * // Returns the reloaded Quest record once every hop between "created" and "explore_flows" lands
 */
import { questGetBroker, questModifyBroker } from '@dungeonmaster/orchestrator/brokers';
import {
  getQuestInputContract,
  questContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { Quest, QuestStatus } from '@dungeonmaster/shared/contracts';

import { dmHttpRequestAdapter } from '../../../adapters/dm-http/request/dm-http-request-adapter';
import { dmHttpResponseUnwrapAdapter } from '../../../adapters/dm-http/response-unwrap/dm-http-response-unwrap-adapter';
import { questFieldsToModifyInputTransformer } from '../../../transformers/quest-fields-to-modify-input/quest-fields-to-modify-input-transformer';
import { questStatusWalkPathTransformer } from '../../../transformers/quest-status-walk-path/quest-status-walk-path-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const IN_PROGRESS_STATUS: QuestStatus = 'in_progress';

export const questReachRouteBroker = async ({
  from,
  to,
  target,
  record,
}: {
  from: QuestStatus;
  to: QuestStatus;
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<Quest> => {
  const questId = questIdContract.parse(record.id);
  const hops = questStatusWalkPathTransformer({ from, to });

  await hops.reduce<Promise<void>>(async (previous, hop) => {
    await previous;

    if (hop === IN_PROGRESS_STATUS) {
      if (target.baseUrl === undefined) {
        throw new Error(
          'questReachRouteBroker: a write-only target cannot walk a quest to "in_progress" — seeding the operations relay needs POST /api/quests/:questId/start, which has no in-process equivalent exported from @dungeonmaster/orchestrator. Use an api target instead.',
        );
      }
      const startPath = `/api/quests/${questId}/start`;
      const response = await dmHttpRequestAdapter({ target, method: 'POST', path: startPath });
      dmHttpResponseUnwrapAdapter({ response, url: `${target.baseUrl}${startPath}` });
      return;
    }

    const modifyResult = await questModifyBroker({
      input: questFieldsToModifyInputTransformer({ questId, fields: { status: hop } }),
    });
    if (!modifyResult.success) {
      throw new Error(
        `questReachRouteBroker: could not reach "${hop}" — ${String(modifyResult.error)}`,
      );
    }
  }, Promise.resolve());

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success) {
    throw new Error(
      `questReachRouteBroker: reload failed after walking to "${to}" — ${String(getResult.error)}`,
    );
  }
  return questContract.parse(getResult.quest);
};
