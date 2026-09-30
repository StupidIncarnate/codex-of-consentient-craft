import { hookStartupSrcPathResolveTransformer } from './hook-startup-src-path-resolve-transformer';

const PACKAGE_ROOT = '/repo/packages/hooks';

describe('hookStartupSrcPathResolveTransformer', () => {
  describe('standard dist bin path', () => {
    it('VALID: {./dist/src/startup/start-pre-edit-hook.js} => strips src/ prefix and resolves to src .ts path', () => {
      const binPath = './dist/src/startup/start-pre-edit-hook.js';

      const result = hookStartupSrcPathResolveTransformer({ binPath, packageRoot: PACKAGE_ROOT });

      expect(result).toBe('/repo/packages/hooks/src/startup/start-pre-edit-hook.ts');
    });

    it('VALID: {./dist/startup/start-pre-bash-hook.js} => resolves to src .ts path', () => {
      const binPath = './dist/startup/start-pre-bash-hook.js';

      const result = hookStartupSrcPathResolveTransformer({ binPath, packageRoot: PACKAGE_ROOT });

      expect(result).toBe('/repo/packages/hooks/src/startup/start-pre-bash-hook.ts');
    });
  });

  describe('non-dist bin path', () => {
    it('EMPTY: {./bin/script.js} => returns undefined', () => {
      const binPath = './bin/script.js';

      const result = hookStartupSrcPathResolveTransformer({ binPath, packageRoot: PACKAGE_ROOT });

      expect(result).toBe(undefined);
    });
  });
});
