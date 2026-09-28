import { resolve } from '#gateway/node/path';
import { typescriptContentDiagnosticsBroker } from './typescript-content-diagnostics-broker';
import { typescriptContentDiagnosticsBrokerProxy } from './typescript-content-diagnostics-broker.proxy';

// Computed at module load, before any test starts timing — a real ts.Program measures roughly a
// second per call (see typescriptProgramDiagnosticsAdapter's own comment, packages/hydration), and
// jest only charges a test for what runs between that test's own start and finish.
const VALID_CONTENT_RESULT = typescriptContentDiagnosticsBroker({
  content: `import { defineConfig } from '@playwright/test';

const config = defineConfig({ testMatch: '**/*.e2e.ts' });

export default config;
`,
});

const TYPE_ERROR_RESULT = typescriptContentDiagnosticsBroker({
  content: `const value: number = 'not a number';
console.log(value);
`,
});

const UNUSED_LOCAL_RESULT = typescriptContentDiagnosticsBroker({
  content: `import { defineConfig } from '@playwright/test';

const unused = 1;

export default defineConfig({});
`,
});

// A regression guard for the compiler-options drift this broker once had: its own compilerOptions
// used to be hand-copied and go stale against packages/eslint-plugin/configs/tsconfig.json's real
// moduleResolution ("node16") and customConditions (["source"]) — under the old Node10, no-condition
// options this would report a spurious "Cannot find module '#gateway/npm/zod'" diagnostic. The
// import sits directly in this content (not inside some transitive dependency this content merely
// touches) on purpose: diagnostics are read SCOPED to the checked file alone (see the broker's own
// header), so a broken resolution three files deep inside an unrelated sibling contract would not
// surface here even if it existed — only a diagnostic attached to THIS file would, which is exactly
// what a bad #gateway resolution on a direct import produces.
const GATEWAY_SUBPATH_RESULT = typescriptContentDiagnosticsBroker({
  content: `import { z } from '#gateway/npm/zod';

const schema = z.string();
console.log(schema);
`,
});

// A regression guard for the companion-file gap this broker once had: with no dirPath, a
// RELATIVE import always resolved against this file's OWN directory, so a scaffolded template's
// real companion (written beside it in a testbed) could never be found. dirPath here points one
// level up, at this broker's own PARENT directory — a real directory already on disk, so the
// relative import below only resolves if it is read against dirPath rather than against this
// file's own directory (which holds no such path).
const DIR_PATH_COMPANION_RESULT = typescriptContentDiagnosticsBroker({
  content: `import { typescriptContentDiagnosticsBroker } from './content-diagnostics/typescript-content-diagnostics-broker';

console.log(typeof typescriptContentDiagnosticsBroker);
`,
  dirPath: resolve(__dirname, '..'),
});

describe('typescriptContentDiagnosticsBroker', () => {
  describe('valid content', () => {
    it('VALID: {content: imports @playwright/test and typechecks} => returns []', () => {
      typescriptContentDiagnosticsBrokerProxy();

      expect(VALID_CONTENT_RESULT).toStrictEqual([]);
    });
  });

  describe('invalid content', () => {
    it('INVALID: {content: assigns a string to a number} => returns the TS2322 diagnostic', () => {
      typescriptContentDiagnosticsBrokerProxy();

      expect(TYPE_ERROR_RESULT).toStrictEqual([
        "TS2322 [line 1]: Type 'string' is not assignable to type 'number'.",
      ]);
    });

    it('INVALID: {content: declares an unused local} => returns the TS6133 diagnostic', () => {
      typescriptContentDiagnosticsBrokerProxy();

      expect(UNUSED_LOCAL_RESULT).toStrictEqual([
        "TS6133 [line 3]: 'unused' is declared but its value is never read.",
      ]);
    });
  });

  describe('resolving a #gateway subpath', () => {
    it('VALID: {content: imports #gateway/npm/zod directly} => returns [] (moduleResolution/customConditions match the real consumer tsconfig)', () => {
      typescriptContentDiagnosticsBrokerProxy();

      expect(GATEWAY_SUBPATH_RESULT).toStrictEqual([]);
    });
  });

  describe('resolving a companion file via dirPath', () => {
    it("VALID: {content: relative import, dirPath: a real directory} => returns [] (the import resolves against dirPath, not this file's own directory)", () => {
      typescriptContentDiagnosticsBrokerProxy();

      expect(DIR_PATH_COMPANION_RESULT).toStrictEqual([]);
    });
  });
});
