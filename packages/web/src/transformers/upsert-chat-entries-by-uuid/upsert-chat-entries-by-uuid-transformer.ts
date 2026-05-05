/**
 * PURPOSE: Returns a NEW outer Map with `newEntries` upserted into the inner uuid→entry Map for `key`.
 *
 * USAGE:
 * upsertChatEntriesByUuidTransformer({ prev, key: sessionId, newEntries });
 * // Returns Map<K, Map<ChatEntryUuid, ChatEntry>> with newEntries set by uuid (last-write-wins).
 *
 * The web binding holds entries in a uuid-keyed inner Map per session/slot. This transformer is
 * the React-state-friendly upsert: it builds new outer + inner Map references so React state
 * comparison detects the change, while collapsing duplicate uuid emissions from the dual-source
 * convergence (parent stdout + sub-agent JSONL tail emit the same uuid for the same content).
 */
import type { ChatEntry, ChatEntryUuid } from '@dungeonmaster/shared/contracts';

export const upsertChatEntriesByUuidTransformer = <K>({
  prev,
  key,
  newEntries,
}: {
  prev: Map<K, Map<ChatEntryUuid, ChatEntry>>;
  key: K;
  newEntries: readonly ChatEntry[];
}): Map<K, Map<ChatEntryUuid, ChatEntry>> => {
  const next = new Map(prev);
  const existing = next.get(key);
  const inner = existing === undefined ? new Map<ChatEntryUuid, ChatEntry>() : new Map(existing);
  for (const entry of newEntries) {
    inner.set(entry.uuid, entry);
  }
  next.set(key, inner);

  return next;
};
