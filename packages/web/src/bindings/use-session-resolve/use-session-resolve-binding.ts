/**
 * PURPOSE: React hook that resolves a guild session to its quest ID with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useSessionResolveBinding({guildId, sessionId});
 * // Returns {data: {questId: QuestId | null} | null, loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';

import { guildSessionResolveBroker } from '../../brokers/guild/session-resolve/guild-session-resolve-broker';
import type { SessionResolveResponse } from '../../contracts/session-resolve-response/session-resolve-response-contract';

export const useSessionResolveBinding = ({
  guildId,
  sessionId,
}: {
  guildId: GuildId | null;
  sessionId: SessionId | null;
}): {
  data: SessionResolveResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<SessionResolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async (): Promise<void> => {
    if (!guildId || !sessionId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await guildSessionResolveBroker({ guildId, sessionId });
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [guildId, sessionId]);

  useEffect(() => {
    fetchSession().catch(() => undefined);
  }, [fetchSession]);

  return { data, loading, error, refresh: fetchSession };
};
