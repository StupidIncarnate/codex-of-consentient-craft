import { processHookLintIgnoredPathsAdapter } from './process-hook-lint-ignored-paths-adapter';
import { processHookLintIgnoredPathsAdapterProxy } from './process-hook-lint-ignored-paths-adapter.proxy';

describe('processHookLintIgnoredPathsAdapter', () => {
  it('VALID: {env DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS=true} => returns true', () => {
    const proxy = processHookLintIgnoredPathsAdapterProxy();
    proxy.enable();

    expect(processHookLintIgnoredPathsAdapter()).toBe(true);
  });

  it('VALID: {env unset} => returns false', () => {
    const proxy = processHookLintIgnoredPathsAdapterProxy();
    proxy.disable();

    expect(processHookLintIgnoredPathsAdapter()).toBe(false);
  });

  it('VALID: {env set to other value} => returns false', () => {
    processHookLintIgnoredPathsAdapterProxy();
    process.env.DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS = '1';

    expect(processHookLintIgnoredPathsAdapter()).toBe(false);
  });
});
