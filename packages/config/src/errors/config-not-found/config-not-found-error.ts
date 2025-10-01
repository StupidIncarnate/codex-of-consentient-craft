export class ConfigNotFoundError extends Error {
  public constructor({ startPath }: { startPath: string }) {
    super(
      `No .questmaestro configuration file found starting from ${startPath}. Searched up the directory tree but no config file was found.`,
    );
    this.name = 'ConfigNotFoundError';
  }
}
