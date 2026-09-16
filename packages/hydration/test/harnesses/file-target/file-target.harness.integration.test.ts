import { existsSync, rmdirSync } from 'node:fs';
// Aliased so the ts-jest harness-lifecycle transformer's name match (`*Harness()`) skips this
// call. This test drives `beforeEach`/`afterEach` manually, inside the test body, to assert the
// throw-then-cleanup sequence together — the transformer would otherwise wrap a bare
// `fileTargetHarness()` in `__wireHarnessLifecycle`, which registers jest's global
// `beforeEach`/`afterEach`, calls jest refuses from inside a running test.
import { fileTargetHarness as createFileTarget } from './file-target.harness';

describe('fileTargetHarness', () => {
  describe('afterEach()', () => {
    it('VALID: {a permission restore throws} => still removes the temporary home', () => {
      const harness = createFileTarget();
      harness.beforeEach();
      const target = harness.target();
      harness.denyWrites({ relativePath: 'locked' });
      const deniedPath = harness.absolutePath({ relativePath: 'locked' });
      // Removing the denied directory before teardown runs forces its own `chmodSync` restore to
      // throw ENOENT — the real failure mode the fix has to survive, produced with no mocking.
      rmdirSync(deniedPath);

      expect(() => {
        harness.afterEach();
      }).toThrow(/ENOENT/u);
      expect(existsSync(target.home)).toBe(false);
    });
  });
});
