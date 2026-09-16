/**
 * PURPOSE: Halts a plan whose `write` route could not write its file — `EACCES`, `ENOSPC`, a
 * read-only mount — naming the PATH rather than just the errno a caller would otherwise have to
 * trace back by hand. Reach for this over `HydrationRouteFailedError`: a `write` route has no URL
 * and no response body, only a path and an OS-level cause, so it needs its own shape rather than
 * forcing those fields to double as something they are not.
 *
 * USAGE:
 * throw new HydrationWriteFailedError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'guild',
 *   path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
 *   cause: new Error('EACCES: permission denied'),
 * });
 * // Throws error naming the recipe, the ingredient, the path and the underlying OS failure
 *
 * WHEN-TO-USE: From the runner, once a `write` route's underlying file operation rejects.
 * WHEN-NOT-TO-USE: When the parent directory is merely absent — the runner creates it, and that is
 * not a failure at all.
 */
export class HydrationWriteFailedError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    path,
    cause,
  }: {
    recipeName: string;
    ingredientName: string;
    path: string;
    cause: unknown;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}"'s write route failed writing "${path}": ${String(cause)}`,
    );
    this.name = 'HydrationWriteFailedError';
  }
}
