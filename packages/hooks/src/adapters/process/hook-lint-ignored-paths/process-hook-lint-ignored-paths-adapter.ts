/**
 * PURPOSE: Reports whether the pre-edit hook should lint files the project's ESLint config ignores
 *
 * USAGE:
 * const lintIgnored = processHookLintIgnoredPathsAdapter();
 * // Returns true only when DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS === 'true'
 *
 * Default (false) makes the hook honor the same `ignores` list as `npm run ward`. The dungeonmaster
 * hook integration tests set this flag because their specimens live under the globally-ignored
 * `.test-tmp` sandbox and must still be linted to exercise violation detection.
 */
export const processHookLintIgnoredPathsAdapter = (): boolean =>
  process.env.DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS === 'true';
