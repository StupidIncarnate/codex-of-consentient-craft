/**
 * PURPOSE: Represents an error when no .dungeonmaster configuration file is found
 *
 * USAGE:
 * throw new ConfigNotFoundError({startPath: '/path/to/file.js'});
 * // Throws error indicating no config found starting from the given path
 */
export class ConfigNotFoundError extends Error {
  public constructor({ startPath }: { startPath: string }) {
    super(
      `No .dungeonmaster configuration file found starting from ${startPath}. Searched up the directory tree but no config file was found.`,
    );
    this.name = 'ConfigNotFoundError';
  }
}
