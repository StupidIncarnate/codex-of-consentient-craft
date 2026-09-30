/**
 * PURPOSE: Layer of QuestDrivenWatchersBootstrapResponder — walks every quest in every guild,
 * collects the distinct parent sessionIds carried by their ACTIVE workItems, then diffs that set
 * against the caller-supplied watchers map: stops tails for sessionIds that dropped out, starts
 * tails for sessionIds that newly appeared. Spec-phase quests are in scope, so an intake
 * conversation streams into the browser chat panel while it is still being had; so are finished
 * quests, since a follow-up chat and a merge both run on a quest that has already terminated.
 *
 * USAGE:
 * const result = await ReconcileWatchersLayerResponder({ watchers, projectDir });
 * // Mutates `watchers` in place; returns counts for logging.
 *
 * ONE READ PER QUEST, and no quest status is used to narrow it. `questListBroker` already loads and
 * parses every quest.json in a guild, so asking it for SUMMARIES and then re-loading each quest by
 * id pays for every file twice — and the second pass costs a whole-home scan per quest to find a
 * file the first pass just read. The only test that decides a tail is the one below: an active work
 * item carrying a sessionId. A quest whose work items carry no session contributes nothing to that
 * set whatever its status, so there is no status filter to apply and none to keep in step with the
 * loop.
 *
 * This runs on a 3-second poll AND on every quest-modified outbox event, so its cost is paid
 * continuously for the life of the server.
 */

import {
  reconcileWatchersResultContract,
  type ReconcileWatchersResult,
} from '../../../contracts/reconcile-watchers-result/reconcile-watchers-result-contract';
import { guildPathContract } from '@dungeonmaster/shared/contracts';
import type { GuildPath, SessionId, Quest, WorkItem } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { questSessionCwdTransformer } from '@dungeonmaster/shared/transformers';
import { StartOrchestrator, questListBroker } from '@dungeonmaster/orchestrator';

import { processDevLogBroker } from '../../../brokers/process/dev-log/process-dev-log-broker';

export const ReconcileWatchersLayerResponder = async ({
  watchers,
  projectDir,
}: {
  watchers: Map<SessionId, { stop: () => void }>;
  projectDir: string;
}): Promise<ReconcileWatchersResult> => {
  const guilds = await StartOrchestrator.listGuilds();
  // Track each quest's owning guild so the watcher uses the guild's `path` (not the
  // server's process.cwd()) when encoding the Claude CLI sessions directory. In prod
  // the two coincide because Claude Code, MCP, and the HTTP server all launch from
  // the repo-root that's also the guild's path. In e2e tests the dev server's cwd
  // (packages/server) does NOT match the synthetic guildPath (/tmp/dm-e2e-…), so a
  // cwd-encoded path would point at a directory the test never seeds.
  const guildPathByQuestId = new Map<Quest['id'], GuildPath>();
  const questsByGuild = await Promise.all(
    guilds
      .filter((guild) => guild.valid)
      .map(async (guild) => {
        const quests = await questListBroker({ guildId: guild.id });
        for (const quest of quests) {
          guildPathByQuestId.set(quest.id, guild.path);
        }
        return quests;
      }),
  );
  const loadedQuests = questsByGuild.flat();

  const target = new Set<SessionId>();
  const projectDirBySessionId = new Map<SessionId, GuildPath>();
  // Which entries came from a quest's own `sessions` ledger rather than from the per-quest guess.
  // Tracked separately so "measured beats inferred" holds regardless of the order guilds are walked
  // in — see the comment at the assignment below.
  const recordedProjectDirSessions = new Set<SessionId>();
  // Every active work item's session is a Node-dispatch worker's own dedicated session:
  // its agent (codeweaver/flowrider/…) writes the MAIN session JSONL, so the watcher must
  // route that content to the work item's row rather than treat it as chatter. Keyed
  // sessionId → owning workItemId.
  const workerWorkItemIdBySessionId = new Map<SessionId, WorkItem['id']>();
  // The quest each worker session's owning work item belongs to, captured in lockstep with the
  // map above. The tail emits its own terminal event when it stops, and `chat-complete` is a
  // per-quest event — a frame with no questId reaches no subscriber at all.
  const workerQuestIdBySessionId = new Map<SessionId, Quest['id']>();
  for (const quest of loadedQuests) {
    // The FALLBACK, for a session the quest recorded no row for. Claude CLI encodes the JSONL
    // directory from the child's own cwd, so this per-quest guess is right only while every
    // session on the quest shares one: it holds through the spec phase, and stops holding the
    // moment riftcarver carves, because the intake conversation stays under the guild encoding
    // while every role after the carve writes under the worktree's. Live and replay disagreeing
    // about where a session lives is the whole defect the ledger below closes.
    const questProjectDir =
      quest.worktreePath === undefined
        ? guildPathByQuestId.get(quest.id)
        : guildPathContract.parse(quest.worktreePath);
    for (const wi of quest.workItems) {
      if (wi.sessionId === undefined) continue;
      if (!isActiveWorkItemStatusGuard({ status: wi.status })) continue;
      target.add(wi.sessionId);
      // A recorded row is where the session ACTUALLY ran, so it outranks the guess above — and it
      // must outrank it whichever quest the walk reached first. One sessionId legitimately appears
      // on work items across SEVERAL quests, so a plain first-writer-wins would let the first
      // quest's guess lock the map and a later quest's real row never land. Two guesses still keep
      // first-writer-wins, which is the arbitrary tie-break the ledger retires one session at a
      // time.
      const recordedCwd = questSessionCwdTransformer({ quest, sessionId: wi.sessionId });
      if (recordedCwd !== null) {
        if (!recordedProjectDirSessions.has(wi.sessionId)) {
          projectDirBySessionId.set(wi.sessionId, guildPathContract.parse(recordedCwd));
          recordedProjectDirSessions.add(wi.sessionId);
        }
      } else if (questProjectDir !== undefined && !projectDirBySessionId.has(wi.sessionId)) {
        projectDirBySessionId.set(wi.sessionId, questProjectDir);
      }
      if (!workerWorkItemIdBySessionId.has(wi.sessionId)) {
        workerWorkItemIdBySessionId.set(wi.sessionId, wi.id);
        workerQuestIdBySessionId.set(wi.sessionId, quest.id);
      }
    }
  }

  let stopped = 0;
  for (const [sessionId, handle] of watchers) {
    if (target.has(sessionId)) continue;
    handle.stop();
    watchers.delete(sessionId);
    stopped += 1;
    processDevLogBroker({
      message: `quest-driven-watchers: stopped tail for session ${String(sessionId)}`,
    });
  }

  const sessionsToStart = Array.from(target).filter((sessionId) => !watchers.has(sessionId));
  const startResults = await Promise.all(
    sessionsToStart.map(async (sessionId) => {
      try {
        const workerWorkItemId = workerWorkItemIdBySessionId.get(sessionId);
        const workerQuestId = workerQuestIdBySessionId.get(sessionId);
        const resolvedProjectDir = projectDirBySessionId.get(sessionId);
        if (
          resolvedProjectDir === undefined ||
          workerWorkItemId === undefined ||
          workerQuestId === undefined
        ) {
          // Every sessionId in `target` was added by the SAME loop iteration that also records a
          // projectDirBySessionId entry (the recorded cwd or the quest's own guess, always defined —
          // every quest here came from `guildPathByQuestId`, populated for that exact quest.id before
          // this loop runs), a workerWorkItemIdBySessionId entry and a workerQuestIdBySessionId entry
          // for it. All three are invariants, not real fallbacks, so this branch names the bootstrap's
          // own cwd only for triage if it ever fires.
          throw new Error(
            `quest-driven-watchers: incomplete session record for ${String(sessionId)}; bootstrap cwd was ${projectDir}`,
          );
        }
        const handle = await StartOrchestrator.startMonitorWatcher({
          parentSessionId: String(sessionId),
          projectDir: resolvedProjectDir,
          workerWorkItemId: workerWorkItemId,
          workerQuestId: workerQuestId,
        });
        return { sessionId, handle };
      } catch (error: unknown) {
        processDevLogBroker({
          message: `quest-driven-watchers: failed to start tail for session ${String(sessionId)}: ${String(error)}`,
        });
        return undefined;
      }
    }),
  );

  let started = 0;
  for (const result of startResults) {
    if (result === undefined) continue;
    watchers.set(result.sessionId, result.handle);
    started += 1;
    processDevLogBroker({
      message: `quest-driven-watchers: started tail for session ${String(result.sessionId)}`,
    });
  }

  return reconcileWatchersResultContract.parse({ started, stopped });
};
