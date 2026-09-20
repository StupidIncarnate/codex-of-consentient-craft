/**
 * PURPOSE: Answers whether a `GuildPath` value is already absolute, so a route can tell a
 * caller's explicit real-directory override apart from the relative fragment `defaults(index)`
 * mints. Reach for this over `absoluteFilePathContract.safeParse` — that contract additionally
 * requires the value to satisfy `AbsoluteFilePath`'s own brand, which a `GuildPath` never carries.
 *
 * USAGE:
 * isAbsoluteGuildPathGuard({ path: guildPathContract.parse('/tmp/guild-1') });
 * // Returns true
 */
import type { GuildPath } from '@dungeonmaster/shared/contracts';

const WINDOWS_DRIVE_PREFIX_PATTERN = /^[A-Za-z]:[/\\]/u;

export const isAbsoluteGuildPathGuard = ({ path }: { path?: GuildPath }): boolean => {
  if (!path) {
    return false;
  }

  return path.startsWith('/') || WINDOWS_DRIVE_PREFIX_PATTERN.test(path);
};
