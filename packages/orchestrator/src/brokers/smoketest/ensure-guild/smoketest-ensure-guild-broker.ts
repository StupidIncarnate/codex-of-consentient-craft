/**
 * PURPOSE: Resolves the guild whose path walks up to the same repo root as the dungeonmaster home, so smoketests run against the codex guild instead of a separate "smoketests" guild
 *
 * USAGE:
 * const { guildId } = await smoketestEnsureGuildBroker();
 * // Returns: { guildId } — the GuildId of the guild that owns the codex repo on disk.
 *
 * WHEN-TO-USE: SmoketestRunResponder calls this before dispatching orchestration cases so
 * questHydrateBroker / chat-spawn / orchestration-loop code that reads guild config by id finds a real entry
 * AND the guild reflects where Claude CLI actually writes its session JSONLs (the codex repo root).
 * WHEN-NOT-TO-USE: Outside the smoketest flow. Guilds for real projects go through guildAddBroker directly.
 *
 * WHY repo-root matching: every agent spawn calls `cwdResolveBroker({ kind: 'repo-root' })` to walk up from
 * the guild path and find the directory containing `.dungeonmaster.json`. Claude CLI runs there, so JSONLs
 * land under `~/.claude/projects/<encoded-repo-root>/<sessionId>.jsonl`. Pinning smoketests to the guild
 * whose path resolves to the same repo root keeps the guild and the session storage in agreement.
 *
 * WHY no fallback creation: silently creating a placeholder smoketest guild is what produced the original
 * disjunction (guild path = `.dungeonmaster-dev/`, JSONLs under codex repo root). If no matching guild exists
 * the user must create one for the repo first; this broker throws a clear error instead.
 */

import { cwdResolveBroker, dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract, guildIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, GuildListItem } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';

export const smoketestEnsureGuildBroker = async (): Promise<{ guildId: GuildId }> => {
  const { homePath } = dungeonmasterHomeFindBroker();
  const homeRepoRoot = await cwdResolveBroker({
    startPath: filePathContract.parse(homePath),
    kind: 'repo-root',
  });

  const guilds = await guildListBroker();

  const candidates = await Promise.all(
    guilds.map(async (guild): Promise<GuildListItem | null> => {
      try {
        const guildRepoRoot = await cwdResolveBroker({
          startPath: filePathContract.parse(guild.path),
          kind: 'repo-root',
        });
        return guildRepoRoot === homeRepoRoot ? guild : null;
      } catch {
        return null;
      }
    }),
  );

  // Tiebreaker: first match by guild creation order (guildListBroker preserves config order).
  // Multiple guilds resolving to the same repo root is rare but possible; first-wins is deterministic.
  const matched = candidates.find((g): g is GuildListItem => g !== null);

  if (matched === undefined) {
    throw new Error(
      `Smoketest requires a guild whose path resolves to the repo root ${homeRepoRoot}; create one via the home page first.`,
    );
  }

  return { guildId: guildIdContract.parse(matched.id) };
};
