/**
 * PURPOSE: Adapter for ESLint's Linter to provide linting functionality
 *
 * USAGE:
 * const linter = eslintLinterAdapter();
 * // Returns Linter instance for linting code
 */
import { Linter } from '#gateway/npm/eslint';

export const eslintLinterAdapter = (): Linter => new Linter();
