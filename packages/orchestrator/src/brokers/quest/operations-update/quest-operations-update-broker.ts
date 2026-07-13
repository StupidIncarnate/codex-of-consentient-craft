/**
 * PURPOSE: The orchestrator's ONLY runtime writer for the quest operations ledger. Applies an
 * operations mutation — and any accompanying workItems write — in ONE atomic read-modify-write
 * persist, then re-derives quest status through the operation-aware transformer.
 *
 * USAGE:
 * await questOperationsUpdateBroker({
 *   questId,
 *   update: ({ quest }) => ({ operations: [...quest.operations, ptItem], workItems: nextWorkItems }),
 * });
 * // Loads the quest under the per-questId lock, applies the returned replacement arrays, derives
 * // status (this is where terminal-operation `complete` fires — there is no trailing workItems
 * // write when the last operation completes), persists once, and returns { quest }. Returning
 * // null from `update` skips the persist entirely (no-op).
 *
 * WHEN-TO-USE: Every runtime ledger mutation — signal-back outcome application, advance creating
 *   the next work item, the relay-graph seed at Start, ward green/red routing. The lock serializes
 *   these calls against each other (double-advance from signal-back + scan self-heal, redelivered
 *   signals); atomicity comes from the single persist.
 * WHEN-NOT-TO-USE: Agent-path writes (ChaosWhisperer authors plan items via modify-quest, which is
 *   allowlist-gated) or any write not touching `operations` — use questModifyBroker. This broker
 *   deliberately bypasses the Tier-2 agent allowlist (`operations` is inspectable, so
 *   quest-modify-broker rejects it at in_progress); execution agents have NO runtime write path.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { OperationItem, Quest, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const questOperationsUpdateBroker = async ({
  questId,
  update,
}: {
  questId: QuestId;
  update: (params: { quest: Quest }) => {
    operations?: OperationItem[];
    workItems?: WorkItem[];
  } | null;
}): Promise<{ quest: Quest } | null> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ quest: Quest } | null> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      const changes = update({ quest });
      if (changes === null) {
        return null;
      }

      const nextOperations = changes.operations ?? quest.operations;
      const nextWorkItems = changes.workItems ?? quest.workItems;

      const mutated = questContract.parse({
        ...quest,
        operations: nextOperations,
        workItems: nextWorkItems,
        // The derivation is what flips the quest `complete` when the LAST operation completes —
        // no other write follows that moment, so a raw persist here would hang it in_progress.
        status: workItemsToQuestStatusTransformer({
          workItems: nextWorkItems,
          operations: nextOperations,
          currentStatus: quest.status,
        }),
        updatedAt: new Date().toISOString(),
      });

      const contents = fileContentsContract.parse(
        JSON.stringify(mutated, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents, questId });

      return { quest: mutated };
    },
  });
