/**
 * PURPOSE: Maps ESLint rules to their enforcement timing (pre-edit vs post-edit)
 *
 * USAGE:
 * import { dungeonmasterRuleEnforceOnStatics } from './statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics';
 * const timing = dungeonmasterRuleEnforceOnStatics['@dungeonmaster/ban-primitives'];
 * // Returns 'pre-edit'
 *
 * WHEN-TO-USE: When determining if a rule should run before or after file write in Claude Code hooks
 * WHEN-NOT-TO-USE: Pre-edit rules must not use file system operations (fsExistsSyncAdapter, etc)
 */
export const dungeonmasterRuleEnforceOnStatics = {
  // Third-party rules - pre-edit (AST only)

  'require-unicode-regexp': 'pre-edit',
  '@typescript-eslint/no-explicit-any': 'pre-edit',
  '@typescript-eslint/ban-ts-comment': 'pre-edit',
  '@typescript-eslint/no-magic-numbers': 'pre-edit',
  'eslint-comments/no-use': 'pre-edit',
  'eslint-comments/no-unlimited-disable': 'pre-edit',
  'jest/no-restricted-jest-methods': 'pre-edit',
  'jest/no-restricted-matchers': 'pre-edit',
  'jest/no-conditional-in-test': 'pre-edit',
  'jest/require-to-throw-message': 'pre-edit',

  // @dungeonmaster - PRE-EDIT (25 rules)
  '@dungeonmaster/ban-adhoc-types': 'pre-edit',
  '@dungeonmaster/enforce-contract-usage-in-tests': 'pre-edit',
  '@dungeonmaster/ban-jest-mock-in-tests': 'pre-edit',
  '@dungeonmaster/ban-primitives': 'pre-edit',
  '@dungeonmaster/enforce-file-metadata': 'pre-edit',
  '@dungeonmaster/require-zod-on-primitives': 'pre-edit',
  '@dungeonmaster/require-contract-validation': 'pre-edit',
  '@dungeonmaster/enforce-object-destructuring-params': 'pre-edit',
  '@dungeonmaster/enforce-optional-guard-params': 'pre-edit',
  '@dungeonmaster/explicit-return-types': 'pre-edit',
  '@dungeonmaster/enforce-stub-patterns': 'pre-edit',
  '@dungeonmaster/enforce-stub-usage': 'pre-edit',
  '@dungeonmaster/enforce-project-structure': 'pre-edit',
  '@dungeonmaster/enforce-import-dependencies': 'pre-edit',
  '@dungeonmaster/enforce-regex-usage': 'pre-edit',
  '@dungeonmaster/forbid-non-exported-functions': 'pre-edit',
  '@dungeonmaster/forbid-todo-skip': 'pre-edit',
  '@dungeonmaster/forbid-type-reexport': 'pre-edit',
  '@dungeonmaster/enforce-test-creation-of-proxy': 'pre-edit',
  '@dungeonmaster/enforce-test-proxy-imports': 'pre-edit',
  '@dungeonmaster/enforce-jest-mocked-usage': 'pre-edit',
  '@dungeonmaster/enforce-magic-arrays': 'pre-edit',
  '@dungeonmaster/jest-mocked-must-import': 'pre-edit',
  '@dungeonmaster/no-multiple-property-assertions': 'pre-edit',
  '@dungeonmaster/no-mutable-state-in-proxy-factory': 'pre-edit',

  // @dungeonmaster - POST-EDIT (4 rules)
  '@dungeonmaster/enforce-proxy-patterns': 'post-edit',
  '@dungeonmaster/enforce-proxy-child-creation': 'post-edit',
  '@dungeonmaster/enforce-implementation-colocation': 'post-edit',
  '@dungeonmaster/enforce-test-colocation': 'post-edit',
} as const;
