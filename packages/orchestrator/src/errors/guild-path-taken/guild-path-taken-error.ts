/**
 * PURPOSE: Represents an error when a guild is registered or updated onto a path another guild
 * already holds — the caller's mistake, not a server fault, so the responder maps this class to
 * 409 Conflict rather than 500.
 *
 * USAGE:
 * throw new GuildPathTakenError({ path: '/home/user/my-app' });
 * // Throws error indicating another guild already holds that path
 *
 * WHEN-TO-USE: From guild-mutation brokers (guildAddBroker, guildUpdateBroker) when a candidate
 * path collides with an existing guild's path, so callers can match the message to distinguish a
 * conflict from other write failures.
 * WHEN-NOT-TO-USE: For per-call validation failures or transient I/O errors — those should remain
 * plain Errors.
 */
export class GuildPathTakenError extends Error {
  public constructor({ path }: { path: string }) {
    super(`A guild with path ${path} already exists`);
    this.name = 'GuildPathTakenError';
  }
}
