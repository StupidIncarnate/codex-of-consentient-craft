/**
 * PURPOSE: Caches extracted session summaries to avoid re-reading JSONL files on every session list request
 *
 * USAGE:
 * sessionSummaryCacheState.get({ sessionId, mtimeMs }); // Returns cached summary or { hit: false }
 * sessionSummaryCacheState.set({ sessionId, mtimeMs, summary }); // Caches a summary
 * sessionSummaryCacheState.clear(); // Clears all cached summaries
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';
import type { MtimeMs } from '../../contracts/mtime-ms/mtime-ms-contract';
import type { SessionSummary } from '../../contracts/session-summary/session-summary-contract';

const cache = new Map<SessionId, { mtimeMs: MtimeMs; summary: SessionSummary | undefined }>();

export const sessionSummaryCacheState = {
  get: ({
    sessionId,
    mtimeMs,
  }: {
    sessionId: SessionId;
    mtimeMs: MtimeMs;
  }): { hit: true; summary: SessionSummary | undefined } | { hit: false } => {
    const entry = cache.get(sessionId);
    if (entry && entry.mtimeMs === mtimeMs) {
      return { hit: true, summary: entry.summary };
    }
    return { hit: false };
  },

  set: ({
    sessionId,
    mtimeMs,
    summary,
  }: {
    sessionId: SessionId;
    mtimeMs: MtimeMs;
    summary: SessionSummary | undefined;
  }): void => {
    cache.set(sessionId, { mtimeMs, summary });
  },

  clear: (): void => {
    cache.clear();
  },
} as const;
