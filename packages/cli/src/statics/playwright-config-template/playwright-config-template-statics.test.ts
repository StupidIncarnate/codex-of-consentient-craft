import { playwrightConfigTemplateStatics } from './playwright-config-template-statics';

describe('playwrightConfigTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(playwrightConfigTemplateStatics).toStrictEqual({
      content: `import { defineConfig } from '@playwright/test';

export default defineConfig({ testMatch: '**/*.e2e.ts', timeout: 30_000 });
`,
    });
  });
});
