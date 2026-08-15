/**
 * PURPOSE: The orchestrator's ONLY runtime writer for the quest operations ledger. Applies an
 * operations mutation — and any accompanying workItems, git-context (branchName, baseBranch,
 * worktreePath, baseRef), packageGraph or riftcarverResults write — in ONE atomic read-modify-write
 * persist, then re-derives quest status through the operation-aware transformer.
 *
 * USAGE:
 * await questOperationsUpdateBroker({
 *   questId,
 *   update: ({ quest }) => ({ operations: [...quest.operations, ptItem], workItems: nextWorkItems }),
 * });
 * // Loads the quest under the per-questId lock, applies the returned replacement arrays and any
 * // git-context fields, derives status (this is where terminal-operation `complete` fires — there
 * // is no trailing workItems write when the last operation completes), persists once, and returns
 * // { quest }. Returning null from `update` skips the persist entirely (no-op).
 *
 * WHEN-TO-USE: Every runtime ledger mutation — signal-back outcome application, advance creating
 *   the next work item, the relay-graph seed at Start, the quest's git-context record at Start,
 *   ward green/red routing. The lock serializes these calls against each other (double-advance from
 *   signal-back + scan self-heal, redelivered signals); atomicity comes from the single persist.
 * WHEN-NOT-TO-USE: Agent-path writes (ChaosWhisperer authors plan items via modify-quest, which is
 *   allowlist-gated) or any write not touching `operations` or the quest's git context — use
 *   questModifyBroker. This broker deliberately bypasses the Tier-2 agent allowlist (`operations`
 *   is inspectable, so quest-modify-broker rejects it at in_progress); execution agents have NO
 *   runtime write path.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  OperationItem,
  Quest,
  QuestId,
  RiftcarverResult,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
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
    baseRef?: NonNullable<Quest['baseRef']>;
    branchName?: NonNullable<Quest['branchName']>;
    baseBranch?: NonNullable<Quest['baseBranch']>;
    worktreePath?: NonNullable<Quest['worktreePath']>;
    packageGraph?: Quest['packageGraph'];
    riftcarverResults?: RiftcarverResult[];
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
      // The quest's git context rides this persist rather than a following write so it lands
      // atomically with the relay it seeds. `branchName` and `worktreePath` are what every later
      // dispatch, ward run and chat spawn for this quest resolves its cwd from; `baseBranch` is
      // what the merge targets; `baseRef` is the fork-point sha the review diff is measured from,
      // held stable as the base branch moves ahead with other work. A crash between two separate
      // writes would leave a seeded relay pointing at a quest with no recorded git context, or a
      // review diff falling back to a base that silently collapses once the base branch absorbs
      // the quest's own implementation commits.
      const nextBaseRef = changes.baseRef ?? quest.baseRef;
      const nextBranchName = changes.branchName ?? quest.branchName;
      const nextBaseBranch = changes.baseBranch ?? quest.baseBranch;
      const nextWorktreePath = changes.worktreePath ?? quest.worktreePath;
      // The derived package dependency graph rides the same persist for the same reason as the git
      // context: the relay seeded in this write is ordered from it, so a crash between two writes
      // would leave a dependency-ordered ledger beside no graph to justify it.
      const nextPackageGraph = changes.packageGraph ?? quest.packageGraph;
      // Riftcarver's result ref rides this persist rather than a preceding questModifyBroker call,
      // which is what ward does for `wardResults`. Ward's separate write opens a real crash window:
      // the result file exists on disk with no ref in the quest. Here the log ref, the work item's
      // `riftcarverResults/<id>` back-link and the ledger mutation the outcome implies are
      // all-or-nothing in one write — and riding this broker keeps `riftcarverResults` off the
      // modify-quest allowlist entirely, since no agent ever writes it.
      const nextRiftcarverResults = changes.riftcarverResults ?? quest.riftcarverResults;

      const mutated = questContract.parse({
        ...quest,
        operations: nextOperations,
        workItems: nextWorkItems,
        packageGraph: nextPackageGraph,
        riftcarverResults: nextRiftcarverResults,
        ...(nextBaseRef === undefined ? {} : { baseRef: nextBaseRef }),
        ...(nextBranchName === undefined ? {} : { branchName: nextBranchName }),
        ...(nextBaseBranch === undefined ? {} : { baseBranch: nextBaseBranch }),
        ...(nextWorktreePath === undefined ? {} : { worktreePath: nextWorktreePath }),
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
