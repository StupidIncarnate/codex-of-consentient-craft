/**
 * PURPOSE: Scans disk for Claude session JSONL files, extracts summaries, and correlates with quest metadata
 *
 * USAGE:
 * const sessions = await sessionListBroker({ guildId, getCache, setCache });
 * // Returns sorted session entries with optional quest correlation
 */

import { absoluteFilePathContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { isoTimestampContract } from '@dungeonmaster/orchestrator';

import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { globFindAdapter } from '../../../adapters/glob/find/glob-find-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { claudeProjectPathEncoderTransformer } from '../../../transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';
import { extractSessionFileSummaryTransformer } from '../../../transformers/extract-session-file-summary/extract-session-file-summary-transformer';
import { hasSessionSummaryGuard } from '../../../guards/has-session-summary/has-session-summary-guard';
import { globPatternContract } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
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

  const jsonlFiles = await globFindAdapter({
    pattern: globPatternContract.parse('*.jsonl'),
    cwd: claudeProjectDir,
  });

  const diskResults = await Promise.all(
    jsonlFiles.map(async (filePath) => {
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

  const quests = await orchestratorListQuestsAdapter({ guildId });
  const sessionToQuest = new Map(
    quests
      .filter((q) => q.activeSessionId !== undefined)
      .map((q) => [String(q.activeSessionId), q] as const),
  );

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

  allSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return allSessions;
};
