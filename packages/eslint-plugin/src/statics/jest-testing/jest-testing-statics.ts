/**
 * PURPOSE: Defines Jest testing patterns and forbidden test suffixes
 *
 * USAGE:
 * import { jestTestingStatics } from './statics/jest-testing/jest-testing-statics';
 * const isTestMethod = jestTestingStatics.methods.includes('describe');
 * // Returns true
 * const isForbidden = jestTestingStatics.forbiddenSuffixes.includes('skip');
 * // Returns true
 *
 * WHEN-TO-USE: When validating test code patterns or detecting test blocks
 */
export const jestTestingStatics = {
  methods: ['test', 'it', 'describe'],
  forbiddenSuffixes: ['todo', 'skip'],
  cleanupFunctions: ['clearAllMocks', 'resetAllMocks', 'restoreAllMocks', 'resetModuleRegistry'],
} as const;
