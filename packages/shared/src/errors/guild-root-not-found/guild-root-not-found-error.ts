/**
 * PURPOSE: Represents an error when no guild.json is found searching up the directory tree
 *
 * USAGE:
 * throw new GuildRootNotFoundError({startPath: '/home/user/.dungeonmaster/guilds/foo/quests'});
 * // Throws error indicating no guild root found starting from the given path
 */
export class GuildRootNotFoundError extends Error {
  public constructor({ startPath }: { startPath: string }) {
    super(
      `No guild.json found starting from ${startPath}. Searched up the directory tree but no guild root was found.`,
    );
    this.name = 'GuildRootNotFoundError';
  }
}
