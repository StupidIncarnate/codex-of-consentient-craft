export class InvalidConfigError extends Error {
  constructor({ message, configPath }: { message: string; configPath?: string }) {
    const locationStr = configPath ? ` in ${configPath}` : '';
    super(`Invalid configuration${locationStr}: ${message}`);
    this.name = 'InvalidConfigError';
  }
}
