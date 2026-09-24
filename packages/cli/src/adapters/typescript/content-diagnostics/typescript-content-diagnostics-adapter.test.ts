import { typescriptContentDiagnosticsAdapter } from './typescript-content-diagnostics-adapter';
import { typescriptContentDiagnosticsAdapterProxy } from './typescript-content-diagnostics-adapter.proxy';

// Computed at module load, before any test starts timing — a real ts.Program measures roughly a
// second per call (see typescriptProgramDiagnosticsAdapter's own comment, packages/hydration), and
// jest only charges a test for what runs between that test's own start and finish.
const VALID_CONTENT_RESULT = typescriptContentDiagnosticsAdapter({
  content: `import { defineConfig } from '@playwright/test';

const config = defineConfig({ testMatch: '**/*.e2e.ts' });

export default config;
`,
});

const TYPE_ERROR_RESULT = typescriptContentDiagnosticsAdapter({
  content: `const value: number = 'not a number';
console.log(value);
`,
});

const UNUSED_LOCAL_RESULT = typescriptContentDiagnosticsAdapter({
  content: `import { defineConfig } from '@playwright/test';

const unused = 1;

export default defineConfig({});
`,
});

describe('typescriptContentDiagnosticsAdapter', () => {
  describe('valid content', () => {
    it('VALID: {content: imports @playwright/test and typechecks} => returns []', () => {
      typescriptContentDiagnosticsAdapterProxy();

      expect(VALID_CONTENT_RESULT).toStrictEqual([]);
    });
  });

  describe('invalid content', () => {
    it('INVALID: {content: assigns a string to a number} => returns the TS2322 diagnostic', () => {
      typescriptContentDiagnosticsAdapterProxy();

      expect(TYPE_ERROR_RESULT).toStrictEqual([
        "TS2322 [line 2]: Type 'string' is not assignable to type 'number'.",
      ]);
    });

    it('INVALID: {content: declares an unused local} => returns the TS6133 diagnostic', () => {
      typescriptContentDiagnosticsAdapterProxy();

      expect(UNUSED_LOCAL_RESULT).toStrictEqual([
        "TS6133 [line 4]: 'unused' is declared but its value is never read.",
      ]);
    });
  });
});
