/**
 * PURPOSE: Adapter for creating ESLint instances with custom options
 *
 * USAGE:
 * const eslint = eslintEslintAdapter({ options: { overrideConfigFile: true, baseConfig: config } });
 * // Returns ESLint instance
 */
import { ESLint } from 'eslint';

export const eslintEslintAdapter = ({ options }: { options: ESLint.Options }): ESLint =>
  new ESLint(options);
