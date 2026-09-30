/**
 * PURPOSE: Caches extracted session summaries to avoid re-reading JSONL files on every session list request
 *
 * USAGE:
 * sessionSummaryCacheState.get({ sessionId, mtimeMs }); // Returns cached summary or { hit: false }
 * sessionSummaryCacheState.set({ sessionId, mtimeMs, summary }); // Caches a summary
 * sessionSummaryCacheState.clear(); // Clears all cached summaries
 */

import type { SessionId } from '@dungeonmaster/shared/contracts';

const cache = new Map<SessionId, { mtimeMs: number; summary: string | undefined }>();

export const sessionSummaryCacheState = {
  get: ({
    sessionId,
    mtimeMs,
  }: {
    sessionId: SessionId;
    mtimeMs: number;
  }): { hit: true; summary: string | undefined } | { hit: false } => {
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
    mtimeMs: number;
    summary: string | undefined;
  }): void => {
    cache.set(sessionId, { mtimeMs, summary });
  },

  clear: (): void => {
    cache.clear();
  },
} as const;
