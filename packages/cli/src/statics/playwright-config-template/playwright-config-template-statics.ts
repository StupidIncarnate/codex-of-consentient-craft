/**
 * PURPOSE: Minimal self-contained Playwright config written into end-user repos so `.e2e.ts` tests run
 *
 * USAGE:
 * playwrightConfigTemplateStatics.content;
 * // Returns the literal playwright.config.ts file contents
 */

export const playwrightConfigTemplateStatics = {
  content: `import { defineConfig } from '@playwright/test';

export default defineConfig({ testMatch: '**/*.e2e.ts', timeout: 30_000 });
`,
} as const;
