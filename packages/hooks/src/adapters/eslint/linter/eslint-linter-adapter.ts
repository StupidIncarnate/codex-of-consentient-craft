/**
 * PURPOSE: Adapter for ESLint's Linter to provide linting functionality
 *
 * USAGE:
 * const linter = eslintLinterAdapter();
 * // Returns Linter instance for linting code
 */
import { Linter } from 'eslint';

export const eslintLinterAdapter = (): Linter => new Linter();
