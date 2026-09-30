/**
 * PURPOSE: Represents an error when the requested guild id is not present in the dungeonmaster config (removed or never existed)
 *
 * USAGE:
 * throw new GuildNotFoundError({ guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Throws error indicating the guild is not found in the config
 *
 * WHEN-TO-USE: From guild-lookup brokers (guildGetBroker, guildRemoveBroker, guildUpdateBroker) so callers
 * can `instanceof`-check to distinguish a gone-guild from other load failures.
 * WHEN-NOT-TO-USE: For per-call validation failures or transient I/O errors — those should remain plain Errors.
 */
export class GuildNotFoundError extends Error {
  public constructor({ guildId }: { guildId: string }) {
    super(`Guild not found: ${guildId}`);
    this.name = 'GuildNotFoundError';
  }
}
