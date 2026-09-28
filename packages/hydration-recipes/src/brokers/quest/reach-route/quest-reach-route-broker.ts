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
 * `extraFields` is what a create-time status difference needs to carry over: `questApiRouteBroker`
 * calls this route whenever a recipe's `setRaw`'d status folds past `created`, and the real create
 * endpoint never reads anything off the wire but `guildId`/`title`/`userRequest` — so a recipe's own
 * `flows`/`designDecisions`/`packagesAffected` would otherwise be silently dropped on a live target,
 * even though the SAME fields on a write-only target land directly (the whole record is written in
 * one shot there). Applied via one extra `questModifyBroker` call the moment the walk reaches
 * `explore_flows` (`exploreFlowsSafeFieldsStatics`) — the EARLIEST status whose own
 * `questStatusInputAllowlistStatics` entry admits them, `created` forbidding all three outright —
 * so the REAL `flows_approved`/`approved` gates see the same content the recipe already declared,
 * the way production data would carry it, rather than being bypassed. A caller with nothing to
 * carry over (no `extraFields`, or none of the three fields non-empty) pays no extra call and this
 * route behaves exactly as it always has — a bare `set()` walk with no content supplied still hits
 * the real gate's own refusal, unchanged. `hops` (the FORWARD path from `from` to `to`) never lists
 * `from` itself, so the two apply-sites below (the walk STARTING at `explore_flows`, or a hop
 * LANDING on it) can never both fire for the same walk — no shared "already applied" flag needed,
 * which is what keeps this inline rather than a nested function `forbid-non-exported-functions`
 * refuses.
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
import { exploreFlowsSafeFieldsStatics } from '../../../statics/explore-flows-safe-fields/explore-flows-safe-fields-statics';
import { dmHttpTransportFailureTransformer } from '../../../transformers/dm-http-transport-failure/dm-http-transport-failure-transformer';
import { questFieldsToModifyInputTransformer } from '../../../transformers/quest-fields-to-modify-input/quest-fields-to-modify-input-transformer';
import { questStatusWalkPathTransformer } from '../../../transformers/quest-status-walk-path/quest-status-walk-path-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const IN_PROGRESS_STATUS: QuestStatus = 'in_progress';
const EXPLORE_FLOWS_STATUS: QuestStatus = 'explore_flows';

export const questReachRouteBroker = async ({
  from,
  to,
  target,
  record,
  extraFields,
}: {
  from: QuestStatus;
  to: QuestStatus;
  target: DmTarget;
  record: Record<string, unknown>;
  extraFields?: Record<string, unknown>;
}): Promise<Quest> => {
  const questId = questIdContract.parse(record.id);
  const hops = questStatusWalkPathTransformer({ from, to });

  const gateContentFields = Object.fromEntries(
    Object.entries(extraFields ?? {}).filter(
      ([key, value]) =>
        (exploreFlowsSafeFieldsStatics.names as readonly unknown[]).includes(key) &&
        Array.isArray(value) &&
        value.length > 0,
    ),
  );
  const hasGateContent = Object.keys(gateContentFields).length > 0;

  if (hasGateContent && from === EXPLORE_FLOWS_STATUS) {
    const contentResult = await questModifyBroker({
      input: questFieldsToModifyInputTransformer({ questId, fields: gateContentFields }),
    });
    if (!contentResult.success) {
      throw new Error(
        `questReachRouteBroker: could not seed gate content at "${EXPLORE_FLOWS_STATUS}" — ${String(contentResult.error)}`,
      );
    }
  }

  await hops.reduce<Promise<void>>(async (previous, hop) => {
    await previous;

    if (hop === IN_PROGRESS_STATUS) {
      if (target.baseUrl === undefined) {
        throw new Error(
          'questReachRouteBroker: a write-only target cannot walk a quest to "in_progress" — seeding the operations relay needs POST /api/quests/:questId/start, which has no in-process equivalent exported from @dungeonmaster/orchestrator. Use an api target instead.',
        );
      }
      const startPath = `/api/quests/${questId}/start`;
      const url = `${target.baseUrl}${startPath}`;
      const response = await (async (): ReturnType<typeof dmHttpRequestAdapter> => {
        try {
          return await dmHttpRequestAdapter({ target, method: 'POST', path: startPath });
        } catch (cause) {
          throw dmHttpTransportFailureTransformer({ cause, url });
        }
      })();
      dmHttpResponseUnwrapAdapter({ response, url });
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

    if (hasGateContent && hop === EXPLORE_FLOWS_STATUS) {
      const contentResult = await questModifyBroker({
        input: questFieldsToModifyInputTransformer({ questId, fields: gateContentFields }),
      });
      if (!contentResult.success) {
        throw new Error(
          `questReachRouteBroker: could not seed gate content at "${EXPLORE_FLOWS_STATUS}" — ${String(contentResult.error)}`,
        );
      }
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
