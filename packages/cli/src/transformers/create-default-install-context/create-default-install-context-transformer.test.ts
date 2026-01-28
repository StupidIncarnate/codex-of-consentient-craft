import { createDefaultInstallContextTransformer } from './create-default-install-context-transformer';

describe('createDefaultInstallContextTransformer', () => {
  describe('default context creation', () => {
    it('VALID: {} => returns context with cwd as targetProjectRoot', () => {
      const result = createDefaultInstallContextTransformer();

      expect(result.targetProjectRoot).toBe(process.cwd());
    });

    it('VALID: {} => returns context with cwd as dungeonmasterRoot', () => {
      const result = createDefaultInstallContextTransformer();

      expect(result.dungeonmasterRoot).toBe(process.cwd());
    });
  });
});
