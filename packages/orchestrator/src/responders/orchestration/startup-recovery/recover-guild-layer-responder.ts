/**
 * PURPOSE: Recovers active quests for a single guild after a server restart — the
 * startup-recovery trigger of #quest-resume-worktree, kept in sync with the user-resume responder's
 * launch body (architecturally unable to share it directly: responders cannot import responders).
 * Resolves each quest's worktree before it is orphan-reset or launched so a deleted worktree
 * blocks only that quest instead of corrupting the guild-wide sweep.
 *
 * USAGE:
 * const recoveredIds = await RecoverGuildLayerResponder({guildItem});
 * // Scans guild quests, blocks any whose recorded worktree is missing (excluded from the
 * // returned array), restores a drifted worktree onto its quest branch, and launches
 * // orchestration loops for the rest
 */

import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildListItem,
  ModifyQuestInput,
  Quest,
  QuestId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';

import type { SlotIndex } from '@dungeonmaster/shared/contracts';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questBlockOnFailureBroker } from '../../../brokers/quest/block-on-failure/quest-block-on-failure-broker';
import { questCwdResolveBroker } from '../../../brokers/quest/cwd-resolve/quest-cwd-resolve-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import { worktreeResumeRestoreBroker } from '../../../brokers/worktree/resume-restore/worktree-resume-restore-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import {
  isActiveWorkItemStatusGuard,
  isRecoverableQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

export const RecoverGuildLayerResponder = async ({
  guildItem,
}: {
  guildItem: GuildListItem;
}): Promise<QuestId[]> => {
  if (!guildItem.valid) {
    return [];
  }

  const recoveredIds: QuestId[] = [];

  try {
    const quests = await questListBroker({ guildId: guildItem.id });
    const guild = await guildGetBroker({ guildId: guildItem.id });
    const startPath = filePathContract.parse(guild.path);

    const candidateQuests = quests.filter((quest) => {
      if (!isRecoverableQuestStatusGuard({ status: quest.status })) {
        return false;
      }
      const existingProcess = orchestrationProcessesState.findByQuestId({ questId: quest.id });
      return !existingProcess;
    });

    // Resolve each candidate's cwd BEFORE it is orphan-reset or launched — the same worktree
    // resolution the user-resume responder and the dispatch scan run for their own triggers
    // (#resume-triggers-all-three).
    const resolutions = await Promise.all(
      candidateQuests.map(async (quest) => ({
        quest,
        resolution: await questCwdResolveBroker({ questId: quest.id }),
      })),
    );

    // Each quest's worktree gate runs independently — resolved via Promise.all (not a for-of
    // loop) so one quest's await does not serialize behind another's, and so a per-quest failure
    // (caught below) cannot manifest as an await-in-loop that blocks the whole sweep.
    const gatedQuests = await Promise.all(
      resolutions.map(async ({ quest, resolution }): Promise<Quest | null> => {
        try {
          if (resolution.kind === 'missing-worktree') {
            // The worktree this quest itself created and then lost is an operator error the
            // dispatcher cannot route around (unlike a legacy pre-worktree quest, which is
            // meant to fall back to the repo root — the `repo-root` branch below). Block it and
            // name the path; it is excluded from recoveredIds and gets neither an orphan reset
            // nor a launched loop. Mirrors blockOnMissingWorktreeLayerBroker's reason format and
            // carrier rule exactly, inlined here because layer files cannot be imported across
            // domains.
            const reason = errorMessageContract.parse(
              `Worktree not found: ${resolution.worktreePath}`,
            );
            const carrier =
              quest.workItems.find(
                (item) => !isTerminalWorkItemStatusGuard({ status: item.status }),
              ) ?? quest.workItems[quest.workItems.length - 1];

            if (carrier === undefined) {
              await questModifyBroker({
                input: { questId: quest.id, status: 'blocked' } as ModifyQuestInput,
              });
            } else {
              await questBlockOnFailureBroker({
                questId: quest.id,
                failedWorkItemId: carrier.id,
                reason,
              });
            }
            return null;
          }

          if (resolution.kind === 'worktree' && quest.branchName !== undefined) {
            // Never throws. The tree is present, so a failed re-checkout is not a reason to
            // abandon recovery — log and let the resumed session start from whatever branch the
            // worktree is actually on.
            const restoreResult = await worktreeResumeRestoreBroker({
              worktreePath: absoluteFilePathContract.parse(resolution.cwd),
              branchName: quest.branchName,
            });
            if (!restoreResult.restored) {
              process.stderr.write(
                `[recover-guild-layer-responder] failed to restore quest ${quest.id} to branch ${quest.branchName}: ${restoreResult.output}\n`,
              );
            }
          }

          // `repo-root` (a legacy pre-worktree quest) falls straight through here untouched.
          return quest;
        } catch (error: unknown) {
          // One quest's worktree resolution or block must not abort recovery for the guild's
          // other quests — that failure is contained here rather than left to escape into the
          // outer catch below, which only tolerates ENOENT from the guild-wide quest-list read.
          process.stderr.write(
            `[recover-guild-layer-responder] failed to resolve worktree state for quest ${quest.id}: ${String(error)}\n`,
          );
          return null;
        }
      }),
    );

    const recoverableQuests = gatedQuests.filter((quest): quest is Quest => quest !== null);

    // Reset orphaned active work items to pending across every recoverable quest, keeping
    // sessionId + the resume marker so Node dispatch resumes the interrupted session. A missing
    // next work item is NOT repaired here — the dispatch scan's operations-aware advance
    // self-heal creates it from the ledger.
    const orphanResets = recoverableQuests
      .filter((quest) =>
        quest.workItems.some((wi) => isActiveWorkItemStatusGuard({ status: wi.status })),
      )
      .map(async (quest) => {
        const orphanedItems = quest.workItems
          .filter((wi) => isActiveWorkItemStatusGuard({ status: wi.status }))
          .map((wi) => ({
            id: wi.id,
            status: 'pending' as const,
            ...(wi.sessionId === undefined ? {} : { resume: true }),
          }));

        const resetInput = modifyQuestInputContract.parse({
          questId: quest.id,
          workItems: orphanedItems,
        });
        return questModifyBroker({ input: resetInput });
      });

    await Promise.all(orphanResets);

    for (const quest of recoverableQuests) {
      const processId = processIdContract.parse(`proc-recovery-${crypto.randomUUID()}`);
      const abortController = new AbortController();

      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: quest.id,
          kill: () => {
            abortController.abort();
          },
        },
      });

      // Per-slot sessionId memo — sessionId arrives on a later emission than the first entries, so memo the latest per slot.
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

      questOrchestrationLoopBroker({
        processId,
        questId: quest.id,
        startPath,
        guildId: guildItem.id,
        onAgentEntry: ({ slotIndex, entries, questWorkItemId, sessionId }) => {
          const payload = buildOrchestrationLoopOnAgentEntryTransformer({
            processId,
            slotIndexToSessionId,
            slotIndex,
            entries,
            questId: quest.id,
            workItemId: questWorkItemId,
            ...(sessionId === undefined ? {} : { sessionId }),
          });
          orchestrationEventsState.emit({ type: 'chat-output', processId, payload });
        },
        abortSignal: abortController.signal,
      })
        .then(() => {
          orchestrationProcessesState.remove({ processId });
        })
        .catch(() => {
          orchestrationProcessesState.remove({ processId });
        });

      recoveredIds.push(quest.id);
    }
  } catch (error: unknown) {
    const isFileNotFound =
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    if (!isFileNotFound) {
      throw error;
    }
  }

  return recoveredIds;
};
