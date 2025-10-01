export class InvalidConfigError extends Error {
  public constructor({ message, configPath }: { message: string; configPath?: string }) {
    const locationStr = configPath !== undefined && configPath !== '' ? ` in ${configPath}` : '';
    super(`Invalid configuration${locationStr}: ${message}`);
    this.name = 'InvalidConfigError';
  }
}
