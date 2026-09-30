/**
 * PURPOSE: Answers whether a `GuildPath` value is already absolute, so a route can tell a
 * caller's explicit real-directory override apart from the relative fragment `defaults(index)`
 * mints. Reach for this over an absolute-path parse — a `GuildPath` is a relative fragment or an
 * absolute override, and only this guard tells the two apart.
 *
 * USAGE:
 * isAbsoluteGuildPathGuard({ path: '/tmp/guild-1' });
 * // Returns true
 */

const WINDOWS_DRIVE_PREFIX_PATTERN = /^[A-Za-z]:[/\\]/u;

export const isAbsoluteGuildPathGuard = ({ path }: { path?: string }): boolean => {
  if (!path) {
    return false;
  }

  return path.startsWith('/') || WINDOWS_DRIVE_PREFIX_PATTERN.test(path);
};
