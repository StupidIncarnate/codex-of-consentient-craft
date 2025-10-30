/**
 * PURPOSE: Adapter for creating ESLint instances with custom options
 *
 * USAGE:
 * const eslint = eslintEslint({ options: { overrideConfigFile: true, baseConfig: config } });
 * // Returns ESLint instance
 */
import { ESLint } from 'eslint';

export type { ESLint };

export const eslintEslint = ({ options }: { options: ESLint.Options }): ESLint =>
  new ESLint(options);
