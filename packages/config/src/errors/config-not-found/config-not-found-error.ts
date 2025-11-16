/**
 * PURPOSE: Represents an error when no .questmaestro configuration file is found
 *
 * USAGE:
 * throw new ConfigNotFoundError({startPath: '/path/to/file.js'});
 * // Throws error indicating no config found starting from the given path
 */
export class ConfigNotFoundError extends Error {
  public constructor({ startPath }: { startPath: string }) {
    super(
      `No .questmaestro configuration file found starting from ${startPath}. Searched up the directory tree but no config file was found.`,
    );
    this.name = 'ConfigNotFoundError';
  }
}
