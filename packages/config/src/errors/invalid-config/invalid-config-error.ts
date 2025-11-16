/**
 * PURPOSE: Represents an error when configuration file content is invalid
 *
 * USAGE:
 * throw new InvalidConfigError({message: 'Missing required field', configPath: '/path/config'});
 * // Throws error indicating invalid configuration with optional path context
 */
export class InvalidConfigError extends Error {
  public constructor({ message, configPath }: { message: string; configPath?: string }) {
    const locationStr = configPath !== undefined && configPath !== '' ? ` in ${configPath}` : '';
    super(`Invalid configuration${locationStr}: ${message}`);
    this.name = 'InvalidConfigError';
  }
}
