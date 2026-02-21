/**
 * PURPOSE: React hook that fetches the list of sessions for a guild with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useSessionListBinding({guildId});
 * // Returns {data: SessionListItem[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { GuildId, SessionListItem } from '@dungeonmaster/shared/contracts';

import { guildSessionListBroker } from '../../brokers/guild/session-list/guild-session-list-broker';

export const useSessionListBinding = ({
  guildId,
}: {
  guildId: GuildId | null;
}): {
  data: SessionListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(guildId !== null);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async (): Promise<void> => {
    if (guildId === null) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessions = await guildSessionListBroker({ guildId });
      setData(sessions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchSessions().catch(() => undefined);
  }, [fetchSessions]);

  return { data, loading, error, refresh: fetchSessions };
};
