/**
 * PURPOSE: Bumps a guild's default path fragment (`guilds-under-test/guild-<n>`, the shape
 * `guildIngredientBroker`'s own `defaults(index)` always mints) forward by `by`, or returns it
 * UNCHANGED when it does not match that shape — an explicit custom path a caller `set()`s never
 * matches. Reach for this from `guildUniquePathResolveBroker`'s own retry loop rather than
 * hand-parsing the fragment at the call site: returning the input unchanged (instead of
 * `undefined`) is what lets that loop tell "not a default fragment" apart from "still occupied"
 * with a single equality check, no second return shape to carry.
 *
 * USAGE:
 * guildDefaultPathBumpTransformer({ path: guildPathContract.parse('guilds-under-test/guild-1'), by: 1 });
 * // Returns 'guilds-under-test/guild-2'
 * guildDefaultPathBumpTransformer({ path: guildPathContract.parse('/home/user/real-project'), by: 1 });
 * // Returns '/home/user/real-project' unchanged
 */

const DEFAULT_PATH_PATTERN = /^(guilds-under-test\/guild-)(\d+)$/u;

export const guildDefaultPathBumpTransformer = ({
  path,
  by,
}: {
  path: string;
  by: number;
}): string => {
  const match = DEFAULT_PATH_PATTERN.exec(path);
  if (match === null) {
    return path;
  }

  const [, prefix, digits] = match;
  return `${prefix ?? ''}${Number(digits) + by}`;
};
