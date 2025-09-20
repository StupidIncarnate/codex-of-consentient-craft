import { isEslintMessage } from './is-eslint-message';
import { isEslintResult } from './is-eslint-result';
import { parseOutput } from './parse-output';
import { lintContent } from './lint-content';
import { lintContentWithFiltering } from './lint-content-with-filtering';
import { runTypescriptCheck } from './run-typescript-check';
import { loadConfigByFile } from './load-config-by-file';
import { createFilteredConfig } from './create-filtered-config';

export const EslintUtil = {
  isEslintMessage,
  isEslintResult,
  parseOutput,
  lintContent,
  lintContentWithFiltering,
  runTypescriptCheck,
  loadConfigByFile,
  createFilteredConfig,
};
