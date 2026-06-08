import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallCreatePlaywrightResponderProxy } from './install-create-playwright-responder.proxy';

describe('InstallCreatePlaywrightResponder', () => {
  describe('existing config', () => {
    it('VALID: {playwright.config.ts exists} => returns skipped without writing', async () => {
      const proxy = InstallCreatePlaywrightResponderProxy();

      proxy.setupFileExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message: 'playwright.config.ts already exists',
      });

      expect(proxy.getWrittenFiles()).toStrictEqual([]);
    });
  });

  describe('missing config', () => {
    it('VALID: {no playwright.config.ts} => creates config with e2e testMatch', async () => {
      const proxy = InstallCreatePlaywrightResponderProxy();

      proxy.setupFileNotExists();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message: 'Created playwright.config.ts',
      });

      const writtenFiles = proxy.getWrittenFiles();

      expect(writtenFiles[0]?.path).toBe('/project/playwright.config.ts');
      expect(writtenFiles[0]?.content).toBe(
        `import { defineConfig } from '@playwright/test';

export default defineConfig({ testMatch: '**/*.e2e.ts', timeout: 30_000 });
`,
      );
    });
  });
});
