/**
 * PURPOSE: Scans disk for Claude session JSONL files, extracts summaries, and correlates with quest metadata
 *
 * USAGE:
 * const sessions = await sessionListBroker({ guildId, getCache, setCache });
 * // Returns session entries sorted most-recently-active-first (by JSONL mtime) with optional quest correlation
 */

import { sessionContract } from '@dungeonmaster/shared/contracts';
import type { Guild, Session } from '@dungeonmaster/shared/contracts';
import { readFile, stat } from '#gateway/node/fs__promises';
import { homedir } from '#gateway/node/os';
import { glob } from '#gateway/npm/glob';
import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { claudeProjectPathEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { extractSessionFileSummaryTransformer } from '../../../transformers/extract-session-file-summary/extract-session-file-summary-transformer';
import { hasSessionSummaryGuard } from '../../../guards/has-session-summary/has-session-summary-guard';
import { globIgnoreStatics } from '../../../statics/glob-ignore/glob-ignore-statics';

export const sessionListBroker = async ({
  guildId,
  getCache,
  setCache,
}: {
  guildId: Guild['id'];
  getCache: (params: {
    sessionId: Session['id'];
    mtimeMs: number;
  }) => { hit: true; summary: string | undefined } | { hit: false };
  setCache: (params: {
    sessionId: Session['id'];
    mtimeMs: number;
    summary: string | undefined;
  }) => void;
}): Promise<unknown[]> => {
  const guild = await StartOrchestrator.getGuild({ guildId });

  const homeDir = homedir();
  const guildPath = guild.path;
  const dummySessionId = sessionContract.shape.id.parse('_probe');
  const probePath = claudeProjectPathEncoderTransformer({
    homeDir,
    projectPath: guildPath,
    sessionId: dummySessionId,
  });
  const claudeProjectDir = probePath.slice(0, probePath.lastIndexOf('/'));

  const directFiles = (
    await glob('*.jsonl', {
      cwd: claudeProjectDir,
      nodir: false,
      ignore: globIgnoreStatics.defaults,
    })
  ).map((file) => file);

  const quests = await StartOrchestrator.listQuests({ guildId });

  // Load full quests so we can walk every work item's sessionId — completed quests no longer
  // have an activeSessionId, but their work items still hold sessionIds for parent + sub-agent
  // sessions that should appear in the home Sessions list.
  const fullQuests = await Promise.all(
    quests.map(async (q) => StartOrchestrator.loadQuest({ questId: q.id }).catch(() => null)),
  );

  const workItemSessionIds = new Set<Session['id']>();
  for (const fullQuest of fullQuests) {
    if (!fullQuest) continue;
    for (const wi of fullQuest.workItems) {
      if (wi.sessionId) {
        workItemSessionIds.add(wi.sessionId);
      }
    }
  }

  const directSessionIds = new Set(
    directFiles.map((p) => p.split('/').pop()?.replace('.jsonl', '') ?? ''),
  );
  const crossProjectRoot = `${homeDir}/.claude/projects`;

  // Collect sessionIds that need cross-project lookup: any sessionId attached to a quest
  // (active or via a work item) that's not already in the direct project dir.
  const candidateSessionIds = new Set<Session['id']>();
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
      (
        await glob(`*/${sessionId}.jsonl`, {
          cwd: crossProjectRoot,
          nodir: false,
          ignore: globIgnoreStatics.defaults,
        })
      ).map((file) => file),
    ),
  );
  const crossProjectFiles = crossProjectFileLists.flat();

  const seenPaths = new Set<string>();
  const dedupedFiles = [...directFiles, ...crossProjectFiles].filter((file) => {
    if (seenPaths.has(file)) {
      return false;
    }
    seenPaths.add(file);
    return true;
  });

  // Sort key for the home Sessions list: last-activity time (JSONL mtime), captured per
  // session below so the most-recently-active sessions sort to the top.
  const mtimeBySessionId = new Map<Session['id'], number>();

  const diskResults = await Promise.all(
    dedupedFiles.map(async (filePath) => {
      const fileName = filePath.split('/').pop() ?? '';
      const diskSessionId = sessionContract.shape.id.parse(fileName.replace('.jsonl', ''));

      try {
        const stats = await stat(filePath);
        const startedAt = new Date(stats.createdAtMs).toISOString();

        const mtimeMs = stats.modifiedAtMs;
        mtimeBySessionId.set(diskSessionId, mtimeMs);
        const cached = getCache({ sessionId: diskSessionId, mtimeMs });
        const diskSummary: ReturnType<typeof extractSessionFileSummaryTransformer> =
          await (async (): Promise<ReturnType<typeof extractSessionFileSummaryTransformer>> => {
            if (cached.hit) {
              return cached.summary;
            }

            try {
              const rawContent = await readFile(filePath);
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
      questId: quest.id,
      questTitle: quest.title,
      questStatus: quest.status,
    };
  });

  allSessions.sort((a, b) => {
    const aMtime = mtimeBySessionId.get(a.sessionId) ?? 0;
    const bMtime = mtimeBySessionId.get(b.sessionId) ?? 0;
    return bMtime - aMtime;
  });

  return allSessions;
};
