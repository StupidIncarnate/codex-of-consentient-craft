import { RegistryUnreadableError } from './registry-unreadable-error';

describe('RegistryUnreadableError', () => {
  describe('constructor()', () => {
    it('VALID: {registryPath, cause} => sets name and full message', () => {
      const error = new RegistryUnreadableError({
        registryPath: '/home/user/.dungeonmaster/siegelense/registry.json',
        cause: new SyntaxError('Unexpected token < in JSON at position 0'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RegistryUnreadableError',
        message:
          'Registry at /home/user/.dungeonmaster/siegelense/registry.json exists and could not be parsed: SyntaxError: Unexpected token < in JSON at position 0',
      });
    });

    it('EDGE: {cause: undefined} => renders the cause as the literal string "undefined"', () => {
      const error = new RegistryUnreadableError({
        registryPath: '/home/user/.dungeonmaster/siegelense/registry.json',
        cause: undefined,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RegistryUnreadableError',
        message:
          'Registry at /home/user/.dungeonmaster/siegelense/registry.json exists and could not be parsed: undefined',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RegistryUnreadableError => returns true', () => {
      const error = new RegistryUnreadableError({
        registryPath: '/home/user/.dungeonmaster/siegelense/registry.json',
        cause: new SyntaxError('Unexpected end of JSON input'),
      });

      expect(error instanceof RegistryUnreadableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RegistryUnreadableError({
        registryPath: '/home/user/.dungeonmaster/siegelense/registry.json',
        cause: new SyntaxError('Unexpected end of JSON input'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
