/**
 * PURPOSE: The quest ingredient's `remove` route — refuses a quest that is actively executing,
 * resolves which guild owns a deletable one via `questOwningGuildFindBroker`, then deletes it
 * through `questDeleteBroker`, imported BY PATH from the orchestrator's `/brokers` subpath. Reach
 * for the bare broker rather than `StartOrchestrator.deleteQuest`: the main
 * `@dungeonmaster/orchestrator` barrel evaluates `startup/start-orchestrator.ts` on import, which
 * boots a rate-limits watcher and a stale-process watchdog at module scope, and a short-lived
 * command like `dungeonmaster siegelense recipes` would then never exit. The deletability RULE
 * itself is read off `@dungeonmaster/shared/guards` rather than off the orchestrator's own
 * `OrchestrationDeleteResponder` — those guards are pure functions over
 * `questStatusMetadataStatics`, the same statics that responder reads, so this route enforces the
 * identical rule with no barrel import at all.
 *
 * A quest's parent is its FOLDER, not a field on the record (`questContract` carries no `guildId`
 * at all), and a `remove` route is handed only `{ target, record }` — no link value rides along
 * the way it does for `write` — so the owning guild has to be found rather than read off the row.
 *
 * USAGE:
 * await questRemoveRouteBroker({ target, record: quest });
 * // Removes the quest folder from disk and appends a quest-modified outbox event; throws if the
 * // quest is in_progress, blocked, or merging
 */
import { questDeleteBroker } from '@dungeonmaster/orchestrator/brokers';
import { questIdContract, questStatusContract } from '@dungeonmaster/shared/contracts';
import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { questOwningGuildFindBroker } from '../owning-guild-find/quest-owning-guild-find-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<{ deleted: boolean }> => {
  const questId = questIdContract.parse(record.id);
  const status = questStatusContract.parse(record.status);

  const isDeletable =
    isTerminalQuestStatusGuard({ status }) ||
    isUserPausedQuestStatusGuard({ status }) ||
    isPreExecutionQuestStatusGuard({ status });

  if (!isDeletable) {
    throw new Error(
      `questRemoveRouteBroker: quest "${questId}" is "${status}" and cannot be removed while it is actively executing — set its status to paused, a terminal status, or a pre-execution status first (e.g. \`q[0].setRaw({ status: 'paused' })\`), then remove it.`,
    );
  }

  const guildId = await questOwningGuildFindBroker({ questId });

  const { success } = await questDeleteBroker({ questId, guildId });
  return { deleted: success };
};
