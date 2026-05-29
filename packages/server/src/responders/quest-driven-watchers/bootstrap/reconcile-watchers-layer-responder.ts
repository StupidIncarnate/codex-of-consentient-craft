/**
 * PURPOSE: Layer of QuestDrivenWatchersBootstrapResponder — walks every guild's quests,
 * collects the distinct parent sessionIds carried by in-progress workItems, then diffs
 * that set against the caller-supplied watchers map: stops tails for sessionIds that
 * dropped out, starts tails for sessionIds that newly appeared.
 *
 * USAGE:
 * const result = await ReconcileWatchersLayerResponder({ watchers, projectDir });
 * // Mutates `watchers` in place; returns counts for logging.
 */

import {
  reconcileWatchersResultContract,
  type ReconcileWatchersResult,
} from '../../../contracts/reconcile-watchers-result/reconcile-watchers-result-contract';
import type { GuildPath, QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
  isStartableQuestStatusGuard,
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
  // Any quest with an agent currently running counts as a watcher target — that's
  // seek_scope (pathseeker-surface), seek_synth (dedup + assertion-correctness),
  // seek_walk (pathseeker-walk), and in_progress (codeweaver/ward/etc). Restricting to
  // `isActivelyExecuting` (in_progress only) misses every pathseeker phase, where the
  // first sub-agent stamp lands. Startable statuses stay in the filter so a quest can
  // be tailed the moment its first agent dispatches even before status transitions.
  const activeQuestSummaries = questsByGuild.flat().filter((summary) => {
    const questStatus = summary.status;
    return (
      isStartableQuestStatusGuard({ status: questStatus }) ||
      isAnyAgentRunningQuestStatusGuard({ status: questStatus })
    );
  });
  const loadedQuests = await Promise.all(
    activeQuestSummaries.map(async (summary) =>
      orchestratorLoadQuestAdapter({ questId: summary.id }),
    ),
  );

  const target = new Set<SessionId>();
  const projectDirBySessionId = new Map<SessionId, GuildPath>();
  for (const quest of loadedQuests) {
    const questProjectDir = guildPathByQuestId.get(quest.id);
    for (const wi of quest.workItems) {
      if (wi.sessionId === undefined) continue;
      if (!isActiveWorkItemStatusGuard({ status: wi.status })) continue;
      target.add(wi.sessionId);
      if (questProjectDir !== undefined && !projectDirBySessionId.has(wi.sessionId)) {
        projectDirBySessionId.set(wi.sessionId, questProjectDir);
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
        const handle = await orchestratorStartMonitorWatcherAdapter({
          parentSessionId: String(sessionId),
          projectDir: projectDirBySessionId.get(sessionId) ?? projectDir,
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
