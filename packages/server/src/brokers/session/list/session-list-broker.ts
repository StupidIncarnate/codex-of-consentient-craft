/**
 * PURPOSE: Scans disk for Claude session JSONL files, extracts summaries, and correlates with quest metadata
 *
 * USAGE:
 * const sessions = await sessionListBroker({ guildId, getCache, setCache });
 * // Returns sorted session entries with optional quest correlation
 */

import {
  absoluteFilePathContract,
  globPatternContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { isoTimestampContract } from '@dungeonmaster/orchestrator';

import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { extractSessionFileSummaryTransformer } from '../../../transformers/extract-session-file-summary/extract-session-file-summary-transformer';
import { hasSessionSummaryGuard } from '../../../guards/has-session-summary/has-session-summary-guard';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { mtimeMsContract } from '../../../contracts/mtime-ms/mtime-ms-contract';
import type { MtimeMs } from '../../../contracts/mtime-ms/mtime-ms-contract';
import type { SessionSummary } from '../../../contracts/session-summary/session-summary-contract';

export const sessionListBroker = async ({
  guildId,
  getCache,
  setCache,
}: {
  guildId: GuildId;
  getCache: (params: {
    sessionId: SessionId;
    mtimeMs: MtimeMs;
  }) => { hit: true; summary: SessionSummary | undefined } | { hit: false };
  setCache: (params: {
    sessionId: SessionId;
    mtimeMs: MtimeMs;
    summary: SessionSummary | undefined;
  }) => void;
}): Promise<unknown[]> => {
  const guild = await orchestratorGetGuildAdapter({ guildId });

  const homeDir = osUserHomedirAdapter();
  const guildPath = absoluteFilePathContract.parse(guild.path);
  const dummySessionId = sessionIdContract.parse('_probe');
  const probePath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath: guildPath,
    sessionId: dummySessionId,
  });
  const claudeProjectDir = filePathContract.parse(
    String(probePath).slice(0, String(probePath).lastIndexOf('/')),
  );

  const directFiles = await globFindAdapter({
    pattern: globPatternContract.parse('*.jsonl'),
    cwd: claudeProjectDir,
  });

  const quests = await orchestratorListQuestsAdapter({ guildId });

  // Load full quests so we can walk every work item's sessionId — completed quests no longer
  // have an activeSessionId, but their work items still hold sessionIds for parent + sub-agent
  // sessions that should appear in the home Sessions list.
  const fullQuests = await Promise.all(
    quests.map(async (q) => orchestratorLoadQuestAdapter({ questId: q.id }).catch(() => null)),
  );

  const workItemSessionIds = new Set<SessionId>();
  for (const fullQuest of fullQuests) {
    if (!fullQuest) continue;
    for (const wi of fullQuest.workItems) {
      if (wi.sessionId) {
        workItemSessionIds.add(wi.sessionId);
      }
    }
  }

  const directSessionIds = new Set(
    directFiles.map((p) => String(p).split('/').pop()?.replace('.jsonl', '') ?? ''),
  );
  const crossProjectRoot = filePathContract.parse(`${homeDir}/.claude/projects`);

  // Collect sessionIds that need cross-project lookup: any sessionId attached to a quest
  // (active or via a work item) that's not already in the direct project dir.
  const candidateSessionIds = new Set<SessionId>();
  for (const q of quests) {
    if (q.activeSessionId !== undefined) {
      candidateSessionIds.add(q.activeSessionId);
    }
  }
  for (const sid of workItemSessionIds) {
    candidateSessionIds.add(sid);
  }
  const crossProjectSessionIds = Array.from(candidateSessionIds).filter(
    (s) => !directSessionIds.has(String(s)),
  );
  const crossProjectFileLists = await Promise.all(
    crossProjectSessionIds.map(async (sessionId) =>
      globFindAdapter({
        pattern: globPatternContract.parse(`*/${sessionId}.jsonl`),
        cwd: crossProjectRoot,
      }),
    ),
  );
  const crossProjectFiles = crossProjectFileLists.flat();

  const seenPaths = new Set<FilePath>();
  const dedupedFiles = [...directFiles, ...crossProjectFiles].filter((file) => {
    if (seenPaths.has(file)) {
      return false;
    }
    seenPaths.add(file);
    return true;
  });

  const diskResults = await Promise.all(
    dedupedFiles.map(async (filePath) => {
      const fileName = String(filePath).split('/').pop() ?? '';
      const diskSessionId = sessionIdContract.parse(fileName.replace('.jsonl', ''));

      try {
        const stats = await fsStatAdapter({ filePath });
        const startedAt = isoTimestampContract.parse(stats.birthtime.toISOString());

        const mtimeMs = mtimeMsContract.parse(stats.mtimeMs);
        const cached = getCache({ sessionId: diskSessionId, mtimeMs });
        const diskSummary: ReturnType<typeof extractSessionFileSummaryTransformer> =
          await (async (): Promise<ReturnType<typeof extractSessionFileSummaryTransformer>> => {
            if (cached.hit) {
              return cached.summary;
            }

            try {
              const rawContent = await fsReadFileAdapter({ filepath: filePath });
              const summary = extractSessionFileSummaryTransformer({
                fileContent: rawContent,
              });
              setCache({
                sessionId: diskSessionId,
                mtimeMs,
                summary,
              });
              return summary;
            } catch {
              setCache({
                sessionId: diskSessionId,
                mtimeMs,
                summary: undefined,
              });
              return undefined;
            }
          })();

        return {
          sessionId: diskSessionId,
          startedAt,
          ...(diskSummary ? { summary: diskSummary } : {}),
        };
      } catch {
        return null;
      }
    }),
  );

  const filteredSessions = diskResults
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .filter((entry) => hasSessionSummaryGuard({ session: entry }));

  // Walk active session IDs AND every work item sessionId so sub-agent/completed-quest
  // sessions correlate back to their quest.
  const activeMappings = quests
    .filter((q) => q.activeSessionId !== undefined)
    .map((q) => [String(q.activeSessionId), q] as const);
  const workItemMappings = fullQuests.flatMap((fullQuest, i) => {
    if (!fullQuest) return [];
    const q = quests[i];
    if (!q) return [];
    return fullQuest.workItems
      .filter((wi) => wi.sessionId !== undefined)
      .map((wi) => [String(wi.sessionId), q] as const);
  });
  const sessionToQuest = new Map([...activeMappings, ...workItemMappings]);

  const allSessions = filteredSessions.map((entry) => {
    const quest = sessionToQuest.get(String(entry.sessionId));
    if (!quest) {
      return entry;
    }
    return {
      ...entry,
      ...(quest.userRequest ? { summary: quest.userRequest } : {}),
      questId: quest.id,
      questTitle: quest.title,
      questStatus: quest.status,
    };
  });

  allSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return allSessions;
};
