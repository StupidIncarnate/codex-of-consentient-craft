/**
 * PURPOSE: Layer of QuestDrivenWatchersBootstrapResponder — walks every quest that can still hold a
 * live session (every non-terminal quest, plus a terminal quest carrying a post-quest session),
 * collects the distinct parent sessionIds carried by their active workItems, then diffs that set
 * against the caller-supplied watchers map: stops tails for sessionIds that dropped out, starts
 * tails for sessionIds that newly appeared. Spec-phase quests are included, so an intake
 * conversation streams into the browser chat panel while it is still being had; a finished quest is
 * included too, since a follow-up chat and a merge both run on a quest that has already terminated.
 *
 * USAGE:
 * const result = await ReconcileWatchersLayerResponder({ watchers, projectDir });
 * // Mutates `watchers` in place; returns counts for logging.
 */

import {
  reconcileWatchersResultContract,
  type ReconcileWatchersResult,
} from '../../../contracts/reconcile-watchers-result/reconcile-watchers-result-contract';
import type {
  GuildPath,
  QuestId,
  QuestWorkItemId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isTerminalQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { orchestratorListGuildsAdapter } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorStartMonitorWatcherAdapter } from '../../../adapters/orchestrator/start-monitor-watcher/orchestrator-start-monitor-watcher-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';

export const ReconcileWatchersLayerResponder = async ({
  watchers,
  projectDir,
}: {
  watchers: Map<SessionId, { stop: () => void }>;
  projectDir: string;
}): Promise<ReconcileWatchersResult> => {
  const guilds = await orchestratorListGuildsAdapter();
  // Track each quest's owning guild so the watcher uses the guild's `path` (not the
  // server's process.cwd()) when encoding the Claude CLI sessions directory. In prod
  // the two coincide because Claude Code, MCP, and the HTTP server all launch from
  // the repo-root that's also the guild's path. In e2e tests the dev server's cwd
  // (packages/server) does NOT match the synthetic guildPath (/tmp/dm-e2e-…), so a
  // cwd-encoded path would point at a directory the test never seeds.
  const guildPathByQuestId = new Map<QuestId, GuildPath>();
  const questsByGuild = await Promise.all(
    guilds
      .filter((guild) => guild.valid)
      .map(async (guild) => {
        const summaries = await orchestratorListQuestsAdapter({ guildId: guild.id });
        for (const summary of summaries) {
          guildPathByQuestId.set(summary.id, guild.path);
        }
        return summaries;
      }),
  );
  // Every non-terminal quest is a candidate, plus a terminal quest whose summary already carries
  // an activeSessionId. The status is only a cheap pre-filter to avoid loading quest.json for
  // quests that can no longer have a live session; the REAL target test is the
  // active-work-item-with-a-sessionId scan below, which is what a tail actually needs.
  //
  // The spec phase is in scope: a quest at `created`/`explore_flows`/`review_flows` has an intake
  // work item carrying the chat session's id, and its tail is what streams that conversation into
  // the browser chat panel while the user is still having it in their terminal. Narrowing this to
  // approved/design_approved/in_progress starts no watcher for those quests and the panel stays
  // empty for the whole intake.
  //
  // A `complete` or `merged` quest can still be carrying a live post-quest session — a follow-up
  // chat with the tavernkeeper, or a merge — so excluding every terminal quest here would leave
  // that session's tail never started. `activeSessionId` on the summary (derived by
  // questToListItemTransformer for every quest regardless of status) answers "does this quest have
  // a session at all" without a quest.json load, so a finished quest that never had a follow-up is
  // still skipped for free.
  const activeQuestSummaries = questsByGuild
    .flat()
    .filter(
      (summary) =>
        !isTerminalQuestStatusGuard({ status: summary.status }) ||
        summary.activeSessionId !== undefined,
    );
  const loadedQuests = await Promise.all(
    activeQuestSummaries.map(async (summary) =>
      orchestratorLoadQuestAdapter({ questId: summary.id }),
    ),
  );

  const target = new Set<SessionId>();
  const projectDirBySessionId = new Map<SessionId, GuildPath>();
  // Sessions whose active work item carries a sessionId but NO agentId are top-level
  // node-dispatch workers (spawn-batch stamps sessionId, never agentId; /dumpster-launch
  // get-agent-prompt stamps BOTH). Their own agent (codeweaver/blightscout/…) writes the
  // MAIN session JSONL, so the watcher must route that content to the work item's row
  // instead of dropping it as dispatcher chatter. Keyed sessionId → owning workItemId;
  // dispatcher (/dumpster-launch parent) sessions never appear here.
  const workerWorkItemIdBySessionId = new Map<SessionId, QuestWorkItemId>();
  // The quest each worker session's owning work item belongs to, captured in lockstep with the
  // map above. The tail emits its own terminal event when it stops, and `chat-complete` is a
  // per-quest event — a frame with no questId reaches no subscriber at all.
  const workerQuestIdBySessionId = new Map<SessionId, QuestId>();
  for (const quest of loadedQuests) {
    const questProjectDir = guildPathByQuestId.get(quest.id);
    for (const wi of quest.workItems) {
      if (wi.sessionId === undefined) continue;
      if (!isActiveWorkItemStatusGuard({ status: wi.status })) continue;
      target.add(wi.sessionId);
      if (questProjectDir !== undefined && !projectDirBySessionId.has(wi.sessionId)) {
        projectDirBySessionId.set(wi.sessionId, questProjectDir);
      }
      if (wi.agentId === undefined && !workerWorkItemIdBySessionId.has(wi.sessionId)) {
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
    processDevLogAdapter({
      message: `quest-driven-watchers: stopped tail for session ${String(sessionId)}`,
    });
  }

  const sessionsToStart = Array.from(target).filter((sessionId) => !watchers.has(sessionId));
  const startResults = await Promise.all(
    sessionsToStart.map(async (sessionId) => {
      try {
        const workerWorkItemId = workerWorkItemIdBySessionId.get(sessionId);
        const workerQuestId = workerQuestIdBySessionId.get(sessionId);
        const handle = await orchestratorStartMonitorWatcherAdapter({
          parentSessionId: String(sessionId),
          projectDir: projectDirBySessionId.get(sessionId) ?? projectDir,
          ...(workerWorkItemId === undefined ? {} : { workerWorkItemId: String(workerWorkItemId) }),
          ...(workerQuestId === undefined ? {} : { workerQuestId: String(workerQuestId) }),
        });
        return { sessionId, handle };
      } catch (error: unknown) {
        processDevLogAdapter({
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
    processDevLogAdapter({
      message: `quest-driven-watchers: started tail for session ${String(result.sessionId)}`,
    });
  }

  return reconcileWatchersResultContract.parse({ started, stopped });
};
