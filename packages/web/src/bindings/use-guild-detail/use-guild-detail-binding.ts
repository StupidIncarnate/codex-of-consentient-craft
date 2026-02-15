/**
 * PURPOSE: React hook that fetches a single guild by ID with loading, error, and refresh support
 *
 * USAGE:
 * const {data, loading, error, refresh} = useGuildDetailBinding({guildId});
 * // Returns {data: Guild | null, loading: boolean, error: Error | null, refresh: () => Promise<void>}
 */
import { useCallback, useEffect, useState } from 'react';

import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';

import { guildDetailBroker } from '../../brokers/guild/detail/guild-detail-broker';

export const useGuildDetailBinding = ({
  guildId,
}: {
  guildId: GuildId | null;
}): {
  data: Guild | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGuild = useCallback(async (): Promise<void> => {
    if (!guildId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const guild = await guildDetailBroker({ guildId });
      setData(guild);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchGuild().catch(() => undefined);
  }, [fetchGuild]);

  return { data, loading, error, refresh: fetchGuild };
};
