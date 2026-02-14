/**
 * PURPOSE: React hook that fetches and manages the list of guilds with loading, error, and refresh support
 *
 * USAGE:
 * const {guilds, loading, error, refresh} = useGuildsBinding();
 * // Returns {guilds: GuildListItem[], loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../brokers/guild/list/guild-list-broker';

export const useGuildsBinding = (): {
  guilds: GuildListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [guilds, setGuilds] = useState<GuildListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGuilds = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await guildListBroker();
      setGuilds(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuilds().catch(() => undefined);
  }, [fetchGuilds]);

  return { guilds, loading, error, refresh: fetchGuilds };
};
